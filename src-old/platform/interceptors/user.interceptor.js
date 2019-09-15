class UserInterceptor {
    constructor(user) {
        this.user = user
    }

    updateUserFields(doc) {
        doc.set('created_by', this.user.id);
        doc.set('updated_by', this.user.id);
    }

    async intercept(modelName, operation, when, docs) {
        if (operation === 'create' && when === 'before') {
            if (this.user) {
                if (Array.isArray(docs))
                    docs.forEach(this.updateUserFields);
                else {
                    this.updateUserFields(docs);
                }
            }
        } else if (operation === 'update' && when === 'before') {
            if (this.user) {
                if (Array.isArray(docs))
                    docs.forEach(doc => {
                        doc.set('updated_by', this.user.id)
                    });
                else {
                    docs.set('updated_by', this.user.id);
                }
            }
        }
        return docs;
    }
}

module.exports = UserInterceptor;