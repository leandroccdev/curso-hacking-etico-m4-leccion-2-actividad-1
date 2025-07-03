require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const lusca = require('lusca');
const app_version = require('./package.json').version;
const tw_util = require('./util/tw.js');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Configura para usar lusca
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" }
}));
/**
 * Inicializa req.session.errors|success
 */
app.use((req, res, next) => {
    if (req.session.errors === undefined)
        req.session.errors = [];

    if (req.session.success === undefined)
        req.session.success = [];

    next();
});
// Configura lusca para protección CSRF
app.use(lusca.csrf({
    header: 'req-id',
    key: 'formid'
}));
app.use(express.static(path.join(__dirname, 'public')));

let blogRouter = require('./routes/blog');
let usersRouter = require('./routes/users');
let adminRouter = require('./routes/admin');

app.use('/', blogRouter);
app.use('/usuario', usersRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // CSRF Error: Redirecciona a url anterior
    if (err.toString().includes("CSRF")) {
        req.session.errors.push('¡La solicitud no pudo se procesada!');
        res.redirect(req.headers.referer);
    }

    else if (err.status == 404) {
        res.status(err.status);
        res.render('not-found', {
            version: app_version,
            wd_color: tw_util.get_color()
        });
    }
    else {
        // render the error page
        res.status(err.status || 500);
        res.render('error', {
            version: app_version
        });
    }
});

module.exports = app;
