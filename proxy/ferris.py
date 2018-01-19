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

import logging, webapp2, json

from datetime import datetime, timedelta
from urlparse import urlparse

from google.appengine.api import memcache
from google.appengine.ext import db
from google.appengine.ext.webapp.util import run_wsgi_app

class Referrer(db.Model):
   group = db.StringProperty()
   hits = db.IntegerProperty(default=0)
   date = db.DateTimeProperty(auto_now=True)

class MainHandler(webapp2.RequestHandler):
   def get(self):
      self.response.headers['Content-Type'] = 'application/json'
      self.response.headers['Access-Control-Allow-Origin'] = '*'

      group = self.request.get('group')

      if (group):
         url = self.request.get('url')
         callback = self.request.get('callback')
         try:
            if (url):
               referrer = memcache.get(url, namespace='ferris')
               if referrer is None:
                  referrer = Referrer.get_by_key_name(url) or \
                        Referrer(key_name=url, group=group)
               else:
                  self.response.headers['X-Ferris-Debug'] = 'Fetched from Memcache'
               referrer.hits += 1
               if referrer.hits % 10 == 0:
                  referrer.put()
               memcache.set(url, referrer, namespace='ferris')
               self.response.headers['X-Ferris-Hits'] = str(referrer.hits)
               self.response.set_status(201)
            else:
               result = memcache.get('referrers', namespace='ferris')
               if result is None:
                  days = int(self.request.get('days') or 1)
                  records = db.GqlQuery('select date, hits from Referrer where group = :1 \
                        and date > :2 order by date desc', group, datetime.now() - timedelta(days=days))
                  referrers = []
                  for item in records:
                     referrers.append({
                        'url': item.key().name(),
                        'hits': item.hits,
                        'date': item.date.isoformat()
                     })
                  result = json.dumps(referrers)
                  memcache.set('referrers', result, 300, namespace='ferris')
                  self.response.headers['X-Ferris-Debug'] = 'Fetched from Datastore'
               else:
                  self.response.headers['X-Ferris-Debug'] = 'Fetched from Memcache'
               if callback:
                  self.response.out.write('%s(%s)' % (callback, result))
               else:
                  self.response.out.write(result)
         except Exception, ex:
            if callback:
              self.response.headers['Content-Type'] = 'application/javascript'
              self.response.out.write('%s(%s)' % (callback, \
                  json.dumps({'status': 500, 'error': ex.__str__()})))
            else:
               raise
      else:
         self.response.set_status(400)

app = webapp2.WSGIApplication([('/ferris', MainHandler)], debug=False)
