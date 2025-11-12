export class UsersAPI {
    constructor(db) {
        this.db = db;
    }

    async getAllUsers() {
        try {
            const users = await this.db.collection('users').find().toArray();
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new Error('Failed to fetch users');
        }
    }

    async getUserByUid(uid) {
        try {
            const user = await this.db.collection('users').findOne({ uid });
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw new Error('Failed to fetch user');
        }
    }

    async addUser(user) {
        try {
            const newUser = await this.db.collection('users').insertOne(user);
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
            throw new Error('Failed to add user');
        }
    }

    async initializeUsers() {
        try {
            const users = await this.db.collection('users').countDocuments();
            if (users === 0) {
                await this.db.collection('users').insertMany([{}]);
            }
        } catch (error) {
            console.error('Error initializing users:', error);
            throw error;
        }
    }
}