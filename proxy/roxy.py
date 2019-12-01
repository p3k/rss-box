#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Copyright 2011 Tobi Schäfer.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging, gzip, cStringIO, cgi, webapp2, json

from datetime import datetime, timedelta
from httplib import responses

from google.appengine.api import urlfetch
from google.appengine.api import memcache
from google.appengine.ext import ndb

class Resource(ndb.Model):
   date = ndb.DateTimeProperty(auto_now_add=True)
   etag = ndb.StringProperty()
   headers = ndb.TextProperty()
   content = ndb.TextProperty()

class HttpError(Exception):
   def __init__(self, response):
      self.response = response

   def __str__(self):
      return repr(self.response.status_code)

class MainHandler(webapp2.RequestHandler):
   def get(self):
      TTL = 60

      self.response.headers['Content-Type'] = 'application/json'
      self.response.headers['Access-Control-Allow-Origin'] = '*'

      callback = self.request.get('callback')
      url = self.request.get('url')

      result = memcache.get(url)

      if result is None:
         headers = {}
         content = ''

         cookie = self.request.get('cookie')
         user_agent = self.request.get('ua')
         referrer = self.request.get('ref')

         try:
            resource = Resource(parent=ndb.Key('URL', url))

            if resource.content is None or datetime.now() - \
                  resource.date > timedelta(seconds=TTL):

               response = urlfetch.fetch(url, headers={
                  'Accept-Encoding': 'gzip',
                  'If-None-Match': resource.etag,
                  'Cookie': cookie,
                  'User-Agent': user_agent,
                  'Referer': referrer
               }, follow_redirects=True)

               headers.update(response.headers)
               headers['X-Roxy-Url'] = response.final_url or url

               if headers.get('content-encoding') == 'gzip':
                  io = cStringIO.StringIO(response.content)
                  file = gzip.GzipFile(fileobj=io, mode='rb')
                  content = file.read()
                  file.close()
               else:
                  content = response.content

               content_type = response.headers.get('content-type')

               if content_type:
                  if content_type.startswith('text/') or \
                        content_type.startswith('application/xml') or \
                        content_type.startswith('application/rss+xml') or \
                        content_type.startswith('application/x-rss+xml') or \
                        content_type.startswith('application/atom+xml'):

                     try:
                        content = content.decode('utf-8-sig')
                     except UnicodeDecodeError:
                        content = content.decode('iso-8859-1')
                     except:
                        raise

                  else:
                     content = content.encode('base64')
               else:
                  content = content.encode('base64')

               if response.status_code == 200:
                  resource.content = content
                  resource.etag = headers.get('etag')
                  resource.headers = json.dumps(headers)
                  self.response.headers['X-Roxy-Debug'] = 'Fetched from URL'
               elif response.status_code != 304:
                  raise HttpError, response
               else:
                  self.response.headers['X-Roxy-Debug'] = 'Fetched from Datastore'

         except Exception, ex:
            if type(ex) == HttpError:
              headers['X-Roxy-Status'] = ex.response.status_code
              headers['X-Roxy-Error'] = responses[ex.response.status_code]
            else:
              headers['X-Roxy-Status'] = 500
              headers['X-Roxy-Error'] = ex.__str__()

            resource = Resource()
            resource.headers = json.dumps(headers)
            logging.error(resource.headers)
            resource.date = datetime.now()

         result = json.dumps({
            'headers': json.loads(resource.headers),
            'content': resource.content
         })

         ## Memcache does not allow values > 1000000 bytes in length
         if len(result) < 1000000:
            memcache.set(url, result, TTL)

      else:
         self.response.headers['X-Roxy-Debug'] = 'Fetched from Memcache'

      if callback:
         self.response.headers['Content-Type'] = 'application/javascript'
         result = '%s(%s)' % (callback, result)

      if self.request.get('Accept-Encoding') == 'gzip':
         self.response.headers['Content-Encoding'] = 'gzip'
         io = cStringIO.StringIO()
         file = gzip.GzipFile(fileobj=io, mode='wb')
         file.write(result)
         file.close()
         result = io.getvalue()

      self.response.out.write(result)

app = webapp2.WSGIApplication([('/roxy', MainHandler)], debug=False)
