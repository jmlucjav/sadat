sadat
=====

This is a small utility to generate documents to index into Solr. It is handy when you have a schem.xml (or are working on one) but you have no documents to index. By using Sadat, you can create some documents to validate the schema/solrconfig you are building is working as expected.

I needed something to practice on while trying to learn js, and I came up with this. Expect WTFs.

Features
------------

- Point it to your Sorl, and it will use Solr REST api to find out about fields, and assign the best generation type it will find. Then you can manually tweak the generation
- Supports: Int, Float, Boolean, Text, Date, Ignore and User defined gereration (see Advanced Configuration). Max/min values are allowed.
- Text generation: uses chance.js Generated text is semi-pronounceable random words
- Allows to generated docs and index them on the fly 

Requirements
-------------------

- Tested with Solr 4.7 (would work with any version that supports a recent REST api)
- Tested on chrome/firefox

Getting started
-------------------

We will use Solr itself to serve the app, but you could host it in any other way.

- Clone the project
- Put the code (keeping the dir hierarchy) under your-solr-collection\solr-webapp\webapp\
- Go to http://localhost:8983/solr/sadat.html
- Enter the url to your collection: http://localhost:8983/solr/collection1
- Now, for each field, tweak the type that will be generated (if you don't like the default chosen), and/or the max/min
- 'Gen Docs' will create the docs, and index them

Advanced Configuration
----------------------

- If you want to integrate it under the Solr Admin menu, overwrite the default admin-extra.menu-bottom.html with the included one (assumes sadat is hosted by Solr webapp)
- The most advanced and interesting configuration is pluging in your our method of generation values for specific fields. This is done as follows:
    - edit js\sadatuser.js
    - add the desired function (must start by 'user'), export it on the return{} block, and add it to userMethods[]. Look at userGenEnum as example. Notice you can use other fields already generated in order to decide the current field's value. User type generation is always called last for this purpose.
    - now if you reload the page, your function should be available in the Generate dropdown

Contributing
----------------

This is released under Apache 2.0 License. If you want to contribute, issues, pull requests, issues etc are welcome.

**Contact**: jmlucjav AT gmail DOT com
