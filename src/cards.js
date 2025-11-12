export class CardsAPI {
    constructor(db) {
        this.db = db;
    }

    async getAllCards() {
        try {
            const cards = await this.db.collection('cards').find().toArray();
            return cards;
        } catch (error) {
            console.error('Error fetching cards:', error);
            throw new Error('Failed to fetch cards');
        }
    }

    async getCardById(id) {
        try {
            const { ObjectId } = await import('mongodb');
            let card;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                card = await this.db.collection('cards').findOne({ _id: new ObjectId(id) });
            } else {
                // Try to find by custom id field
                card = await this.db.collection('cards').findOne({ 
                    $or: [
                        { id: id },
                        { id: parseInt(id) || id }
                    ]
                });
            }
            
            return card;
        } catch (error) {
            console.error('Error fetching card:', error);
            throw new Error('Failed to fetch card');
        }
    }

    async createCard(cardData) {
        try {
            const result = await this.db.collection('cards').insertOne({
                ...cardData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } catch (error) {
            console.error('Error creating card:', error);
            throw new Error('Failed to create card');
        }
    }

    async updateCard(id, cardData) {
        try {
            const { ObjectId } = await import('mongodb');
            let filter;
            
            console.log('Updating card with ID:', id);
            console.log('Update data:', cardData);
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                filter = { _id: new ObjectId(id) };
                console.log('Using MongoDB ObjectId filter');
            } else {
                // Try to find by custom id field (try both string and number)
                const numericId = parseInt(id);
                filter = { 
                    $or: [
                        { id: id },                    // as string
                        { id: numericId },             // as number
                        { _id: id }                    // fallback to _id as string
                    ]
                };
                console.log('Using custom ID filter:', filter);
            }
            
            // First, check if the card exists
            const existingCard = await this.db.collection('cards').findOne(filter);
            console.log('Existing card found:', existingCard ? 'Yes' : 'No');
            if (existingCard) {
                console.log('Existing card:', JSON.stringify(existingCard, null, 2));
            }
            
            // Remove _id from cardData to prevent "immutable field" error
            const { _id, ...updateData } = cardData;
            
            const result = await this.db.collection('cards').updateOne(
                filter,
                { 
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                }
            );
            
            console.log('Update result:', {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            });
            
            return result;
        } catch (error) {
            console.error('Error updating card:', error);
            throw new Error(`Failed to update card: ${error.message}`);
        }
    }

    async deleteCard(id) {
        try {
            const { ObjectId } = await import('mongodb');
            let filter;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                filter = { _id: new ObjectId(id) };
            } else {
                // Try to find by custom id field
                filter = { 
                    $or: [
                        { id: id },
                        { id: parseInt(id) || id }
                    ]
                };
            }
            
            const result = await this.db.collection('cards').deleteOne(filter);
            return result;
        } catch (error) {
            console.error('Error deleting card:', error);
            throw new Error('Failed to delete card');
        }
    }

    async initializeCards() {
        try {
            const count = await this.db.collection('cards').countDocuments();
            if (count === 0) {
                // Start with empty collection, no need to insert anything
                console.log('Cards collection initialized (empty)');
            }
        } catch (error) {
            console.error('Error initializing cards:', error);
            throw error;
        }
    }
}

