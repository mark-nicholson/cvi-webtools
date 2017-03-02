# cvi-webtools
Javascript tools for managing and working with Core-Values personal profiles.

This will allow a web-page to create a "drawing" similar to that on the CVI report.

Additional tools will include:
   -a meeting/group charting tool
       (So everyone can see the "overall" core-values represented by the group)

Building:
   npm update
   npm run build
 or
   nodejs node_modules/uglify-js-harmony/bin/uglifyjs cvi_tools.js --mangle --comments /@source/ > cvi-tools.min.js
   
