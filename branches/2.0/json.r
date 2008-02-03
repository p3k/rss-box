REBOL []

to-json: func [source /local result keys key] [
   switch/default type?/word source [
      object! [
         keys: first source
         result: "({"
         for i 2 length? keys 1 [
            key: pick keys i
            result: rejoin [result {'} key {':} to-json get in source key {,}]
         ]
         remove back tail result
         result: join result "})"
      ]
      
      block! [
         result: "(["
         foreach [item] source [
            result: rejoin [ result to-json item {,} ]
         ]
         remove back tail result
         result: join result "])"
      ]
      
      string! [
         replace/all source cr "\r"
         replace/all source lf "\n"
         replace/all source {"} {\"}
         replace/all source tab "\t"
         result: rejoin [ {(new String("} source {"))} ]
      ]
      
      integer! [
         result: rejoin [ "(new Number(" source "))" ]
      ]
      
      date! [
         result: rejoin [ "(new Date(" source "))" ]
      ]
   ] [
      result: to-json to-string source
   ]
   return result
]
