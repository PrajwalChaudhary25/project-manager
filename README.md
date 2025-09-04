# Project Manager
This is a full-stack web application for managing employee time logs and daily logsheet submissions. It consists of a Django REST framework backend and a React frontend. This README provides a guide for setting up and running the project locally.

## ✨ Features

* **User Authentication:** Secure login for employees and managers.

* **Time Tracking:** Employees can check in, check out, and track break times.

* **Logsheet Submission:** Users can submit their daily logsheets with a JIRA key for approval.

* **Logsheet Approval:** A dedicated dashboard for managers to view, approve, and reject submitted logsheets.

* **Real-time Status:** The application updates to reflect the employee's current work status and shows a "Workday Complete" message once a logsheet has been submitted.

# Backend Setup
## Table of Contents

- [Backend Setup](#backend-setup)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
    - [Authentication](#authentication)
    - [User Management](#user-management)
    - [Subscription Plans](#subscription-plans)
    - [User Subscriptions](#user-subscriptions)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Dependencies](#dependencies)
- [Error Handling](#error-handling)
- [Development](#development)
- [Frontend Setup](#frontend-setup)
    - [Setup Instructions](#setup-instructions-1)

## Prerequisites

- Python 3.11 or higher
- PostgreSQL
- pip (Python package manager)
- Node.js 14+ & npm

## Setup Instructions

1. **Clone the repository**
     ```bash
     git clone https://github.com/PrajwalChaudhary25/project-manager.git
     cd backend
     ```

2. **Create a virtual environment**
     ```bash
     # Windows
     python -m venv myenv
     myenv\Scripts\activate

     # Linux/MacOS
     python3 -m venv myenv
     source myenv/bin/activate
     ```

3. **Install dependencies**
     ```bash
     pip install -r requirements.txt
     ```

4. **Database Setup**
     - Install PostgreSQL if you haven't already
     - Create a new database named `my_subscription_db`
     - Update the database configuration in `backend/settings.py` if needed:
         ```python
         DATABASES = {
                 'default': {
                         'ENGINE': 'django.db.backends.postgresql',
                         'NAME': 'my_subscription_db',
                         'USER': 'admin',
                         'PASSWORD': 'password',
                         'HOST': 'localhost',
                         'PORT': '5432',
                 }
         }
         ```

5. **Apply migrations**
     ```bash
     python manage.py migrate
     ```

6. **Create a superuser**
     ```bash
     python manage.py createsuperuser
     ```

7. **Run the development server**
     ```bash
     python manage.py runserver
     ```

The server will start at `http://127.0.0.1:8000/`

## API Endpoints

### User Profile
- `GET /api/user/profile/` – Get current user profile details

### Attendance (Employee Actions)
- `POST /api/check-in/` – Record user check-in  
- `POST /api/break-start/` – Record start of a break  
- `POST /api/break-end/` – Record end of a break  
- `POST /api/check-out/` – Record user check-out  

### Time Logs & Logsheets (Employee)
- `GET /api/time-logs/` – Get current user’s time logs  
- `POST /api/submit-logsheet/` – Submit a logsheet for approval  
- `GET /api/logsheet-status/` – Get the status of submitted logsheets  

### Manager Endpoints
- `GET /api/manager/logsheets/` – View all submitted logsheets (pending/approved/rejected)  
- `PUT /api/manager/logsheets/<id>/` – Approve or reject a specific logsheet  
- `GET /api/time-logs/<user_id>/<date_str>/` – View a specific user’s time logs for a given date  

### Testing

To run the tests:
```bash
python manage.py test
```

## Project Structure
```
backend/
├── manage.py
├── core/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
|
└── dashboard/
        ├── __init__.py
        ├── admin.py            # Admin interface configuration
        ├── apps.py            # App configuration
        ├── models.py          # Database models
        ├── serializers.py     # API serializers
        ├── tests.py          # Unit tests
        ├── urls.py           # API routing
        ├── views.py          # API views
        └── migrations/       # Database migrations
```

## Dependencies

- Django
- Django REST Framework
- django-cors-headers
- psycopg2-binary
- python-dateutil

## Error Handling

The API uses standard HTTP response codes:
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 404: Not found
- 500: Server error

## Development

1. Make sure to activate your virtual environment before starting development
2. Use `python manage.py makemigrations` when modifying models
3. Apply migrations with `python manage.py migrate`
4. The development server will reload automatically when code changes

# Frontend Setup
The frontend is a react application

## Setup Instructions

1. **Navigate to the forntend directory**
```bash
cd ../frontend
```

2. **Install Dependencies**
Use `npm` to install all the necessary packages defined in `package.json.`
```bash
npm install
```

3. **Start the React Development Server**
```bash
npm start
```
The frontend will be available at `http://localhost:3000/.`