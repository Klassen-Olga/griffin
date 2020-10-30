const Controller = require('../core/controller');
const Passport = require('../core/passport');
const ApiError=require('../core/error');
class MainController extends Controller {

	constructor(...args) {
		super(...args)

		const self = this;

		self.req.authorized = false;
		self.req.user = null;

		self.before(['*'], async function (next) {
			let tokenPayload = Passport.isAuthorized(self.req);
			if (tokenPayload !== false) {
				self.database.User.findOne({
					where: {
						id: tokenPayload.id
					}
				}).then((user) => {
					if (user) {
						self.req.user = user;
						self.req.authorized = true;
					}
					next();
				}).catch((e) => {
					console.error(e);
					next();
				});
			} else {
				next();

			}
		});
	}

	paging(limit=25, page=1){
		const self =this;
		let paging={
			limit:self.param('limit')||limit,
			page:self.param('page') || page,
			offset: self.param('offset') || null
		}

		paging.limit = Number(paging.limit);
		paging.page = Number(paging.page);

		if(paging.offset === null){
			paging.offset = paging.limit * (paging.page-1);
		}
		else{
			paging.offset= Number(paging.offset);
		}
		return paging;
	}


	handleError(error){
		const self = this;

		if (error instanceof ApiError) {
			self.render({
				error: error.message
			}, {
				statusCode: error.statusCode
			})
		} else {
			self.render({
				error: error.message
			}, {
				statusCode: 500
			});
		}
	}

}


module.exports = MainController;