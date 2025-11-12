export class MeAPI {
    constructor(db) {
        this.db = db;
    }
    
    async getMe() {
        try {
            const user = await this.db.collection('me').findOne();
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            throw new Error('Failed to fetch user');
        }
    }

    async updateMe(updatedData) {
        try {
            // Only update the fields that are provided, add updatedAt timestamp
            const updateFields = { ...updatedData, updatedAt: new Date() };
            
            const result = await this.db.collection('me').findOneAndUpdate(
                {}, // Find the first document (assuming single user profile)
                { $set: updateFields }, // Only set the provided fields
                { returnDocument: 'after', upsert: false } // Don't create if doesn't exist
            );
            return result;
        } catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user');
        }
    }

    async initializeMe() {
        try {
            const existingUser = await this.db.collection('me').countDocuments();
            if (existingUser === 0) {
                const defaultUser = {
                    name: 'Azizjon Nigmatjonov',
                    email: 'azizjonnigmatjonov@gmail.com',
                    uid: '68dd78ce3fa15036f9cedce4',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    role: 'admin',
                    status: 'active',
                    profilePicture: 'https://firebasestorage.googleapis.com/v0/b/portfolio-37f86.appspot.com/o/cv%2F57f431a58820974d58c926865d32dffa_1756801360.jpeg?alt=media&token=a1ada5a1-30d2-457a-8f16-d07ba79ecf21',
                    bio: 'I am a software engineer',
                    phone: '+998994912830',
                };
                await this.db.collection('me').insertOne(defaultUser);
                console.log('Default user profile created');
            }
        } catch (error) {
            console.error('Error initializing user profile:', error);
            throw error;
        }
    }
}