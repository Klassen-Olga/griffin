


class Register {


    constructor() {
        const self=this;
        self.usersByName = {};
        self.userSessionIds = {};
    }


    register(user) {
        const self=this;

        self.usersByName[user.name] = user;
        self.userSessionIds[user.id] = user;
    }


    unregister(name) {
        const self=this;

        let user = self.getByName(name);
        if (user) {
            delete self.usersByName[user.name];
            delete self.userSessionIds[user.id];
        }
    }


    removeByName(name) {
        const self=this;

        let user = self.getByName(name);
        if (user) {
            delete self.usersByName[user.name];
            delete self.userSessionIds[user.id];
        }
    }


    getByName(name) {
        const self=this;
        return self.usersByName[name];
    }



    getById(id) {
        const self=this;
        return self.userSessionIds[id];
    }
}
module.exports=Register;
