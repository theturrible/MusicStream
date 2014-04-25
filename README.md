CMSC 506 Music Streaming Service

Group 5: Ivan Grinkevich, and Peter Lee. 

to install:
1) you will need to download mongoDB, and node.js, and taglib( and possibly do a npm install node-gyp)
2) npm update (updates global modules for node)
3) follow tutorial(assuming you have no knowledge of mongoDB isntallation prcedure.) on mongoDB site. 
4) unzip our project into a folder
5) cmd - cd /path/to/folder/with/project 
6) npm install
7) Replace "/Users/theturrible/Dropbox/School/506" with /path/to/folder/with/project in the following 3 locaions:

		~/library_functions.js:216:   util.readDir("/Users/theturrible/Dropbox/School/506/mp3/", function(err, list)
		~/routes/index.js:223:   util.readDir("/Users/theturrible/Dropbox/School/506/mp3/", function(err, list)
		~/routes/index.js:229:   dir: "/Users/theturrible/Dropbox/School/506/mp3/"
8) cmd - cd /path/to/folder/with/project 
9) node app.js
	- if errors - 1) taglib is weird
				  2) chmod 777 ~MongoDBdatafolder ( permissions)

10) go https://localhost:9200 



