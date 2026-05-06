const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../models/database');

// middleware to check if admin is logged in
function checkAdminAuth(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
}

// configure multer for secure file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // rename file to avoid overwriting: timestamp + random number
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // limit to 2MB
    fileFilter: function (req, file, cb) {
        // check extension and mimetype for PDF
        const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
        const isPdfMime = file.mimetype === 'application/pdf';
        
        if (isPdfExt && isPdfMime) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// route to submit a new application
router.post('/apply', (req, res) => {
    // handle file upload using multer
    const uploadSingle = upload.single('resume');
    
    uploadSingle(req, res, async function (err) {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        
        // validate inputs
        const { name, email, phone, college, year, skills, linkedin, portfolio } = req.body;
        
        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Valid name is required" });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: "Valid email is required" });
        }
        if (!skills || skills.trim() === '') {
            return res.status(400).json({ success: false, message: "Skills are required" });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Resume PDF is required" });
        }
        
        try {
            const applications = await db.readApplications();
            
            // create new application object
            const newApp = {
                id: Date.now() + Math.round(Math.random() * 10000).toString(),
                name: name.trim(),
                email: email.trim(),
                phone: phone ? phone.trim() : '',
                college: college ? college.trim() : '',
                year: year ? year.trim() : '',
                skills: skills.trim(),
                linkedin: linkedin ? linkedin.trim() : '',
                portfolio: portfolio ? portfolio.trim() : '',
                resumeFile: req.file.filename,
                status: 'Pending',
                dateApplied: new Date().toISOString()
            };
            
            applications.push(newApp);
            await db.saveApplications(applications);
            
            console.log(`new application submitted by ${newApp.email}`);
            res.json({ success: true, message: "Application submitted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Server error while saving application" });
        }
    });
});

// route for admin login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // simple hardcoded authentication
    if (username === 'admin' && password === 'admin123') {
        req.session.isAdmin = true;
        console.log("admin logged in successfully");
        res.json({ success: true, message: "Logged in successfully" });
    } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
    }
});

// route for admin logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true, message: "Logged out successfully" });
});

// route to get all applications (protected)
router.get('/applications', checkAdminAuth, async (req, res) => {
    try {
        const applications = await db.readApplications();
        res.json({ success: true, data: applications });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch applications" });
    }
});

// route to update application status (protected)
router.put('/applications/:id/status', checkAdminAuth, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    // validate status
    if (!['Pending', 'Selected', 'Rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }
    
    try {
        const applications = await db.readApplications();
        const appIndex = applications.findIndex(app => app.id === id);
        
        if (appIndex === -1) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        // update status
        applications[appIndex].status = status;
        await db.saveApplications(applications);
        
        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
});

// route to delete application (protected)
router.delete('/applications/:id', checkAdminAuth, async (req, res) => {
    const { id } = req.params;
    
    try {
        const applications = await db.readApplications();
        const newApplications = applications.filter(app => app.id !== id);
        
        if (applications.length === newApplications.length) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        
        await db.saveApplications(newApplications);
        res.json({ success: true, message: "Application deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete application" });
    }
});

// route to download resume securely (protected)
router.get('/resume/:filename', checkAdminAuth, (req, res) => {
    const filename = req.params.filename;
    
    // prevent directory traversal attacks
    if (filename.includes('/') || filename.includes('..')) {
        return res.status(400).send("Invalid filename");
    }
    
    const filePath = path.join(__dirname, '../uploads', filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send("File not found");
        }
    });
});

// check login status
router.get('/check-auth', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ success: true, loggedIn: true });
    } else {
        res.json({ success: true, loggedIn: false });
    }
});

module.exports = router;
