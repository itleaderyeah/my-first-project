var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var mysql = require('./../database');
/* GET login page. */
router.get('/login', function(req, res, next) {
  res.render('login',{message:''});
});
/* GET home page. */
router.get('/', function(req, res, next) {
	var page = req.query.page || 1;
	var start = (page-1)*8;
	var end = page*8;
	var queryCount = 'select count(*) as articleNum from article';
	// 实现文章列表的有序排列（新增的文章排在前面）
	var query = 'select * from article order by articleID desc limit 0' +',' + end;
	mysql.query(query,function(err,rows,fields){
		var articles = rows;
		// 遍历articles
		articles.forEach(function(ele){
			var year = ele.articleTime.getFullYear();
			var month = ele.articleTime.getMonth()+1>10?ele.articleTime.getMonth()+1:'0'+(ele.articleTime.getMonth()+1);
			var date = ele.articleTime.getDate()>10?ele.articleTime.getDate():'0'+(ele.articleTime.getDate());
			ele.articleTime = year + '-' + month + '-' + date;
		});
		mysql.query(queryCount,(err,rows,fields)=> {
			var articleNum = rows[0].articleNum;
			var pageNum = Math.ceil(articleNum / 8);
			res.render('index',{articles:articles,user:req.session.user,pageNum:pageNum,page:page});
		});
	});
});
/* 登录信息验证 */
router.post('/login',function(req, res, next){
	var name = req.body.name;
	var password = req.body.password;
	var hash = crypto.createHash('md5');
	hash.update(password);
	password = hash.digest('hex');
	console.log(name,password);
	var query = 'select * from author where authorName='+mysql.escape(name)+'and authorPassword='+mysql.escape(password);
	mysql.query(query,function(err, rows, fields){
		if(err){
			console.log(err);
			return;
		}
		var user = rows[0];
		if(!user){
			res.render('login',{message:'用户名或密码错误'});
			return;
		}
		// 将用户信息存储在session中
		req.session.user = user;
		// req.session.userID = user.authorID;
		res.redirect('/');
	})
});
/* 文章内容页 */
router.get('/articles/:articleID',function(req,res,next){
	var articleID = req.params.articleID;
	// 查看文章内容
	var query = 'select * from article where articleID='+mysql.escape(articleID);
	mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
		// 更新点击量
		var query = 'update article set articleClick=articleClick+1 where articleID='+mysql.escape(articleID);
		var article = rows[0];
		mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
		var year = article.articleTime.getFullYear();
		var month = article.articleTime.getMonth()+1>10?article.articleTime.getMonth()+1:'0'+(article.articleTime.getMonth()+1);
		var date = article.articleTime.getDate()>10?article.articleTime.getDate():'0'+(article.articleTime.getDate());
		article.articleTime = year + '-' + month + '-' + date;
		res.render('article',{article:article});
	});
	});
});
/* 发布文章页面 */
router.get('/edit',(req,res,next) =>{
	var user = req.session.user;
	console.log(user);
	if(!user){
		res.redirect('/login');
	}
	res.render('edit');
});
// 将撰写的文章添加到mysql数据库中
router.post('/edit',(req,res,next) =>{
	var title = req.body.title;
	var content = req.body.content;
	var author = req.session.user.authorName;
	// 文章标题和文章内容不能为空
	if(title.trim().length == 0 || content.trim().length == 0){return res.redirect('/');}
	var query = 'insert into article set articleTitle='+mysql.escape(title)+',articleAuthor='+mysql.escape(author)+',articleContent='+mysql.escape(content)+',articleTime=curdate()';
	mysql.query(query,function(err,rows,fields){
		if(err){
			console.log(err);
			return;
		}
	});
		// 发布完成后返回文章列表页面
		res.redirect('/');
});
// 关于博客路由
router.get('/about',(req,res,next) => {
	res.render('about',{user:req.session.user});
});
// 友情链接路由
router.get('/friends',(req,res) => {
	res.render('friends',{user:req.session.user});
});
// 退出博客路由
router.get('/logout',(req,res,next) => {
	req.session.user = null;
	res.redirect('/');
});
// 修改文章路由
router.get('/modify/:articleID',(req,res,next) => {
	var articleID = req.params.articleID;
	var user = req.session.user;
	console.log(user);
	var query = 'select * from article where articleID =' + mysql.escape(articleID);
	if(!user){
		res.redirect('/login');
		return;
	}
	mysql.query(query,(err,rows,fields) =>{
		if(err){
			console.log(err);
			return;
		}
		var article = rows[0];
		var title = article.articleTitle;
		var content = article.articleContent;
		console.log(title,content);
		res.render('modify',{user,title,content});
	});
});
router.post('/modify/:articleID',(req,res,next) => {
	var articleID = req.params.articleID;
	var user = req.session.user;
	var title = req.body.title;
	var content = req.body.content;
	var query = 'update article set articleTitle =' + mysql.escape(title)+',articleContent='+mysql.escape(content)+'where articleID='+mysql.escape(articleID);
	mysql.query(query,(err,rows,fields) =>{
		if(err){
			console.log(err);
			return;
		}
		res.redirect('/');
	});
});
// 删除文章路由
router.get('/delete/:articleID',(req,res,next) => {
	var articleID = req.params.articleID;
	var user = req.session.user;
	var query = 'delete from article where articleID =' + mysql.escape(articleID);
	if(!user){
		res.redirect('/login');
		return;
	}
	mysql.query(query,(err,rows,fields) =>{
		if(err){
			console.log(err);
			return;
		}
		res.redirect('/');
	});
});
module.exports = router;
