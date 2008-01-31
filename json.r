REBOL []

to-json: func [source /local result key] [
   switch type?/word source [
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
            result: rejoin [result to-json item {,}]
         ]
         remove back tail result
         result: join result "])"
      ]
      
      string! [
         replace/all source lf "\n"
         replace/all source {"} {\"}
         result: rejoin [{(new String("} source {"))}]
      ]
      
      integer! [
         result: rejoin ["(new Number(" source "))"]
      ]
   ]
   return result
]
