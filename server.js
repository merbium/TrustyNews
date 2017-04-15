var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var exphbs = require("express-handlebars");
var app = express();
var PORT = process.env.PORT || 3000;


var News = require("./models/News.js");
var Comment = require("./models/Comment.js");

mongoose.Promise = Promise;

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main"}));
app.set("view engine", "handlebars");
mongoose.connect("mongodb://localhost/TrustyNews");
// mongoose.connect("mongodb://heroku_wtjt5bk4:im5b6upn644mujsf5ki5omlml1@ds155490.mlab.com:55490/heroku_wtjt5bk4");
var db = mongoose.connection;

db.on("error", function(error) {
	console.log("Mongoose error", error);
});

db.once("open", function() {
	console.log("Mongoose made a connection");
});


app.get("/newscraper", function(req, res) {
	request("http://www.theonion.com/", function (error, response, html) {
		var $ = cheerio.load(html);
		$("article.summary").each(function (i, element) {
			var result = {};
			result.image = $(element).find("img").attr("src");
			result.title = $(element).find("h2.headline").find("a").attr("title");
			result.link = $(element).find("h2.headline").find("a").attr("href");
			var entry = new News(result);

			console.log(entry);

			entry.save(function(err, doc) {
				if (err) {
					console.log(err);
				}
				else {
					console.log(doc);
					// res.json(doc);
				}
			});
		});
	});
		res.redirect("/");
});



app.get("/", function(req, res) {
	News.find({}).sort({$natural:-1}).limit(10).exec(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			console.log(doc);
			res.render("index", {News: doc});
		}
	});
});

// app.get("/news", function(req, res) {
// 	News.find({}).limit(10).exec(function(error, doc) {
// 		if (error) {
// 			console.log(error);
// 		}
// 		else {
// 			res.render("index", {News: doc});
// 		}
// 	});
// });


// app.get("/news/:id", function(req, res) {
// 	News.findOne({ "_id": req.params.id })
// 	.populate("comment")
// 	.exec(function(error, doc) {
// 		if(error) {
// 			console.log(error);
// 		}
// 		else {
// 			res.json(doc);
// 		}
// 	});
// });

app.post("/favorites/:id", function(req, res) {
	// News.findOneAndUpdate({ "_id": req.params.id}, {"saved": true});
	News.where({"_id": req.params.id}).update({ $set: {saved: true}})
		.exec(function (error, doc) {
		
		if (error) {
			console.log(error);
		}
		else {
			res.json(doc);
		}
	});
});


app.get("/favorites", function(req, res) {
	News.where({saved: true}).exec(function(error, doc) {
		if(error) {
			console.log(error);
		}
		else {
			res.render("favorites", {News: doc});
		}
	});
});

app.post("/news/:id", function(req, res) {
	var newComment = new Comment(req.body);
	newComment.save(function(error, doc) {
		if (error) {
			console.log(error);
		}
		else {
			News.findOneAndUpdate({ "_id": req.params.id}, {"comment": doc._id}).exec(function(error, doc) {
				if (error) {
					console.log(error);
				}
				else {
					res.send(doc);
				}
			});
		}
	});
});



app.listen(PORT, function() {
  console.log("App running on port 3000!");
});
