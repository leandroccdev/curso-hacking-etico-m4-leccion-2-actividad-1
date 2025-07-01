module.exports = {
    reset_error_messages: (request) => { request.session.errors = []; },
    reset_success_messages: (request) => { request.session.success = []; }
};