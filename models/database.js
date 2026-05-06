const fs = require('fs').promises;
const path = require('path');

const DB_FILE = path.join(__dirname, '../data/applications.json');

// simple lock to prevent overlapping file writes
let isWriting = false;

// initialize the database file if it doesn't exist
async function initDB() {
    try {
        await fs.access(DB_FILE);
    } catch (error) {
        // file does not exist, create it with an empty array
        await fs.writeFile(DB_FILE, JSON.stringify([]));
    }
}

// read all applications safely
async function readApplications() {
    try {
        await initDB();
        const data = await fs.readFile(DB_FILE, 'utf8');
        if (!data.trim()) {
            return []; // handle empty file gracefully
        }
        return JSON.parse(data);
    } catch (error) {
        console.error("error reading database:", error);
        return [];
    }
}

// save applications safely
async function saveApplications(applications) {
    // wait if a write is currently happening
    while (isWriting) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    isWriting = true;
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(applications, null, 2));
    } catch (error) {
        console.error("error saving database:", error);
        throw new Error('Failed to save data');
    } finally {
        isWriting = false;
    }
}

module.exports = {
    readApplications,
    saveApplications
};
