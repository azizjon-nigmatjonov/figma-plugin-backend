export class CategoriesAPI {
    constructor(db) {
        this.db = db;
    }

    async getAllCategories() {
        try {
            const categories = await this.db.collection('categories').find().toArray();
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            throw new Error('Failed to fetch categories');
        }
    }

    async getCategoryById(id) {
        try {
            const { ObjectId } = await import('mongodb');
            let category;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                category = await this.db.collection('categories').findOne({ _id: new ObjectId(id) });
            } else {
                // Try to find by custom id field
                category = await this.db.collection('categories').findOne({ 
                    $or: [
                        { id: id },
                        { id: parseInt(id) || id }
                    ]
                });
            }
            
            return category;
        } catch (error) {
            console.error('Error fetching category:', error);
            throw new Error('Failed to fetch category');
        }
    }

    async createCategory(categoryData) {
        try {
            const result = await this.db.collection('categories').insertOne({
                ...categoryData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return result;
        } catch (error) {
            console.error('Error creating category:', error);
            throw new Error('Failed to create category');
        }
    }

    async updateCategory(id, categoryData) {
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
            
            // Remove _id from categoryData to prevent "immutable field" error
            const { _id, ...updateData } = categoryData;
            
            const result = await this.db.collection('categories').updateOne(
                filter,
                { 
                    $set: {
                        ...updateData,
                        updatedAt: new Date()
                    }
                }
            );
            return result;
        } catch (error) {
            console.error('Error updating category:', error);
            throw new Error('Failed to update category');
        }
    }

    async deleteCategory(id) {
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
            
            const result = await this.db.collection('categories').deleteOne(filter);
            return result;
        } catch (error) {
            console.error('Error deleting category:', error);
            throw new Error('Failed to delete category');
        }
    }

    async initializeCategories() {
        try {
            const count = await this.db.collection('categories').countDocuments();
            if (count === 0) {
                // Start with empty collection, no need to insert anything
                console.log('Categories collection initialized (empty)');
            }
        } catch (error) {
            console.error('Error initializing categories:', error);
            throw error;
        }
    }
}

