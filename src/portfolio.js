import { ObjectId } from 'mongodb';

export class PortfolioAPI {
    constructor(db) {
        this.db = db;
    }

    async getAllPortfolios() {
        try {
            const portfolios = await this.db.collection('portfolios').find().sort({ _id: -1 }).toArray();
            return portfolios;
        } catch (error) {
            console.error('Error fetching portfolios:', error);
            throw new Error('Failed to fetch portfolios');
        }
    }

    async getPortfolioById(id) {
        try {
            let portfolio;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                portfolio = await this.db.collection('portfolios').findOne({ _id: new ObjectId(id) });
            } else if (/^\d+$/.test(id)) {
                // If it's a numeric string, try to find by id field (as number or string)
                portfolio = await this.db.collection('portfolios').findOne({ 
                    $or: [
                        { id: parseInt(id) },
                        { id: id },
                        { slug: id }
                    ]
                });
            } else {
                // Otherwise, try to find by slug
                portfolio = await this.db.collection('portfolios').findOne({ slug: id });
            }
            
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }
            
            return portfolio;
        } catch (error) {
            console.error('Error fetching portfolio by id:', error);
            throw new Error('Failed to fetch portfolio');
        }
    }

    async initializePortfolios() {
        try {
            const portfolios = await this.db.collection('portfolios').countDocuments();
            if (portfolios === 0) {
                const defaultPortfolios = [];
                // Only insert if there are default portfolios to add
                if (defaultPortfolios.length > 0) {
                    await this.db.collection('portfolios').insertMany(defaultPortfolios);
                }
            }
        } catch (error) {
            console.error('Error initializing portfolios:', error);
            throw error;
        }
    }

    async createPortfolio(portfolioData) {
        try {
            // Generate slug from title if title exists
            if (portfolioData.title) {
                portfolioData.slug = portfolioData.title.toLowerCase().replace(/\s+/g, '_');
            }
            
            const result = await this.db.collection('portfolios').insertOne(portfolioData);
            return {
                ...portfolioData,
                _id: result.insertedId
            };
        } catch (error) {
            console.error('Error creating portfolio:', error);
            throw new Error('Failed to create portfolio');
        }
    }

    async updatePortfolio(id, portfolioData) {
        try {
            let query;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                query = { _id: new ObjectId(id) };
            } else if (/^\d+$/.test(id)) {
                // If it's a numeric string, try to find by id field (as number or string)
                query = { 
                    $or: [
                        { id: parseInt(id) },
                        { id: id },
                        { slug: id }
                    ]
                };
            } else {
                // Otherwise, try to find by slug
                query = { slug: id };
            }
            
            // Remove _id from portfolioData to avoid trying to update immutable field
            const { _id, ...updateData } = portfolioData;
            
            const result = await this.db.collection('portfolios').updateOne(
                query,
                { $set: updateData }
            );
            
            if (result.matchedCount === 0) {
                throw new Error('Portfolio not found');
            }
            
            return { _id: id, ...updateData };
        } catch (error) {
            console.error('Error updating portfolio:', error);
            throw new Error('Failed to update portfolio');
        }
    }

    async deletePortfolio(id) {
        try {
            let query;
            
            // Check if id is a valid MongoDB ObjectId (24 character hex string)
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                query = { _id: new ObjectId(id) };
            } else if (/^\d+$/.test(id)) {
                // If it's a numeric string, try to find by id field (as number or string)
                query = { 
                    $or: [
                        { id: parseInt(id) },
                        { id: id },
                        { slug: id }
                    ]
                };
            } else {
                // Otherwise, try to find by slug
                query = { slug: id };
            }
            
            const result = await this.db.collection('portfolios').deleteOne(query);
            
            if (result.deletedCount === 0) {
                throw new Error('Portfolio not found');
            }
            
            return { success: true, message: 'Portfolio deleted successfully' };
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            throw new Error('Failed to delete portfolio');
        }
    }

    // Image tracking methods
    async saveImageMetadata(imageUrl, originalName, folder) {
        try {
            const imageMetadata = {
                url: imageUrl,
                originalName: originalName,
                folder: folder || 'images',
                uploadedAt: new Date(),
            };
            await this.db.collection('images').insertOne(imageMetadata);
            return imageMetadata;
        } catch (error) {
            console.error('Error saving image metadata:', error);
            throw error;
        }
    }

    async getAllImages(folder = null) {
        try {
            const query = folder ? { folder } : {};
            const images = await this.db.collection('images').find(query).sort({ uploadedAt: -1 }).toArray();
            return images;
        } catch (error) {
            console.error('Error fetching images:', error);
            throw error;
        }
    }
}