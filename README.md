# Internship Application Portal

A simple, clean, and lightweight web application built for a student assignment. It allows users to apply for internships by submitting their details and a PDF resume, and includes an admin dashboard to review applications and update their statuses.

## Live Demo
[Open Application](https://internship-portal-noq4.onrender.com)


## Features

### UI & UX Improvements
- **Modern Theme:** A premium Black, Gold, and White color scheme with dark mode card layouts.
- **Enhanced Typography:** Utilizes the Google Font 'Poppins' for a clean, professional look.
- **Interactive Elements:** Smooth hover states, focus outlines, and Font Awesome icons (without emojis).

### Applicant Form Enhancements
- **Extended Fields:** Applicants can now submit Phone Number, College/University, Year of Study, LinkedIn Profile, and Portfolio/GitHub link in addition to the standard fields.
- **Real-time Validation:** User-friendly error messages display below each field.
- **Better Feedback:** Loading states during submission and a clear success confirmation.

### Admin Dashboard Enhancements
- **Summary Statistics:** A top-level view of Total Applications, Pending, Selected, and Rejected counts.
- **Detailed Modal View:** Clicking on any applicant row opens a modal dialog showing their full application details and an embedded button to view their resume.
- **Sorting & Filtering:** Sort applicants by name, date (newest/oldest), or status.
- **Delete Application:** Admins can safely remove applications with a confirmation prompt.
- **Secure File Uploads:** Validates file type (PDF only), renames files with unique identifiers, and limits file size to 2MB.
- **Simple Authentication:** Protected admin routes and resume downloads using `express-session` with a logout functionality.
- **JSON File Database:** Uses a simple JSON file to store data, making it extremely easy to run without database setup.

## Tech Stack Used

- **Frontend:** HTML, CSS (Vanilla), JavaScript (Vanilla)
- **Backend:** Node.js, Express
- **Middleware:** `express-session` (Authentication), `multer` (File uploads)
- **Database:** JSON File Storage (via built-in `fs` module)

## Steps to Run Locally

1. **Prerequisites:** Ensure you have Node.js installed on your machine.
2. **Install Dependencies:**
   Open a terminal in the project root directory and run:
   ```bash
   npm install
   ```
3. **Start the Server:**
   ```bash
   node server.js
   ```
4. **Access the Application:**
   - **Applicant Portal:** Open your browser and go to `http://localhost:3000`
   - **Admin Portal:** Go to `http://localhost:3000/admin-login.html`

## Admin Login Credentials
- **Username:** `admin`
- **Password:** `admin123`

## Folder Structure

- `/public`: Contains all static frontend files (HTML, CSS, JS).
- `/routes`: Contains the API routing logic (`api.js`).
- `/models`: Contains the simple database helper (`database.js`).
- `/uploads`: Directory where uploaded PDF resumes are securely stored.
- `/data`: Contains the `applications.json` file which acts as our database.
- `server.js`: The main entry point for the backend server.

## Security & Implementation Details

- **Authentication:** Admin routes (`/api/applications`, status updates, resume downloads) are protected by a custom middleware `checkAdminAuth` that verifies the session state using `express-session`.
- **File Upload Limits:** Uploads are restricted to **2MB** in size and **PDF files only** (checked via both extension and MIME type) using `multer`.
- **Data Safety:** The JSON database implements a simple mutex lock to prevent concurrent write collisions since Node.js operates asynchronously on a single thread.

## Known Limitations

- **JSON Database:** For simplicity, this project uses a JSON file instead of a full database like MongoDB. It is not designed for high-scale or concurrent heavy traffic, but is perfect for a lightweight student project.
- **Hardcoded Admin:** The admin credentials are hardcoded into the codebase to simplify the prototype. In a production app, these should be securely hashed and stored in a database.
