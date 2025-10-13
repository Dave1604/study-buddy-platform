# Admin Panel Guide 🛡️

## Overview

The Admin Panel is a comprehensive dashboard for platform administrators to manage users, courses, and monitor system-wide statistics.

## Accessing the Admin Panel

1. **Login with Admin Account**:
   ```
   Email: admin@example.com
   Password: password123
   ```

2. **Navigate to Admin Panel**:
   - Click "Admin" in the navigation bar (only visible to admin users)
   - Or go directly to: http://localhost:3000/admin

## Features

### 📊 Overview Tab

**System Statistics**:
- Total Users (with breakdown by role)
- Total Courses
- Total Enrollments
- Average Enrollments per Course

**Recent Activity**:
- Latest 5 registered users
- Top 5 most popular courses by enrollment

### 👥 Users Tab

**User Management Table**:
- View all registered users
- See user details: name, email, role, courses enrolled
- Change user roles (student ↔ instructor ↔ admin)
- Delete users from the system

**Actions**:
- **Change Role**: Click the user icon to update user role
- **Delete User**: Click the trash icon to remove user

### 📚 Courses Tab

**Course Management Table**:
- View all platform courses
- See course details: instructor, category, level, enrollments
- Monitor course status (Published/Draft)
- View lesson count per course

**Actions**:
- **View/Edit Course**: Click the edit icon to view course details
- **Delete Course**: Click the trash icon to remove course

## User Management

### Changing User Roles

1. Navigate to Users tab
2. Find the user you want to modify
3. Click the user check icon (👤✓)
4. Enter new role: `student`, `instructor`, or `admin`
5. Confirm the change

**Use Cases**:
- Promote a student to instructor
- Grant admin privileges
- Demote an admin to regular user

### Deleting Users

1. Navigate to Users tab
2. Find the user to delete
3. Click the trash icon
4. Confirm deletion
5. User and all associated data will be removed

**Warning**: This action cannot be undone!

## Course Management

### Viewing Course Details

1. Navigate to Courses tab
2. Click the edit icon on any course
3. You'll be taken to the course detail page
4. Can view/edit as the course instructor

### Deleting Courses

1. Navigate to Courses tab
2. Find the course to delete
3. Click the trash icon
4. Confirm deletion
5. Course, lessons, and quizzes will be removed

**Warning**: This action cannot be undone!

## Statistics & Analytics

### User Statistics
- **Total Users**: All registered accounts
- **Students**: Users with student role
- **Instructors**: Users with instructor role
- **Admins**: Users with admin privileges

### Course Statistics
- **Total Courses**: Published courses
- **Total Enrollments**: Sum of all course enrollments
- **Average Enrollments**: Enrollments per course

### Popular Courses
- Sorted by enrollment count
- Shows top 5 performing courses
- Includes category information

## Admin Capabilities

### What Admins Can Do:

✅ **User Management**:
- View all users
- Change user roles
- Delete users
- See user statistics

✅ **Course Management**:
- View all courses
- Access any course
- Delete courses
- See course statistics

✅ **System Monitoring**:
- Platform-wide statistics
- Recent activity tracking
- Popular content insights

✅ **Content Control**:
- Moderate all content
- Remove inappropriate courses
- Manage user access

### What Admins CANNOT Do (Currently):

❌ Bulk operations
❌ Export data to CSV
❌ Send email notifications
❌ View detailed logs
❌ Configure platform settings

*(These can be added in future versions)*

## Best Practices

### User Management:
1. **Role Changes**: Verify user credentials before promoting
2. **Deletions**: Always confirm before deleting users
3. **Monitoring**: Regularly review new user registrations

### Course Management:
1. **Quality Control**: Review courses before they're published
2. **Moderation**: Remove inappropriate or low-quality content
3. **Support**: Help instructors with course issues

### System Monitoring:
1. **Regular Checks**: Review statistics weekly
2. **Trends**: Monitor enrollment patterns
3. **Growth**: Track user registration trends

## Security Considerations

### Access Control:
- Only users with `admin` role can access the panel
- JWT token required for all operations
- Admin routes protected at API level

### Data Protection:
- User deletions are permanent
- Course deletions affect all enrolled students
- Always backup before bulk operations

### Audit Trail:
- All admin actions logged in console
- User changes tracked by timestamps
- Consider implementing detailed audit logs

## Troubleshooting

### Can't Access Admin Panel:
- Verify you're logged in as admin
- Check JWT token is valid
- Ensure role is set to 'admin'

### Actions Not Working:
- Check console for error messages
- Verify API connection
- Ensure MongoDB is running

### Data Not Loading:
- Refresh the page
- Clear browser cache
- Check network tab for failed requests

## Admin Workflow Example

### Daily Tasks:
1. Login to admin panel
2. Review overview statistics
3. Check recent user registrations
4. Monitor new course submissions
5. Address any reported issues

### Weekly Tasks:
1. Review user growth trends
2. Analyze popular courses
3. Clean up inactive accounts
4. Moderate reported content

### Monthly Tasks:
1. Analyze platform metrics
2. Generate reports for stakeholders
3. Plan feature improvements
4. Review system performance

## API Endpoints Used

The admin panel uses these API endpoints:

```
GET  /api/users              - Get all users
PUT  /api/users/:id          - Update user
DELETE /api/users/:id        - Delete user

GET  /api/courses            - Get all courses
DELETE /api/courses/:id      - Delete course
```

## Future Enhancements

Planned features for the admin panel:

- 📊 Advanced analytics dashboard
- 📧 Email notification system
- 📁 Bulk import/export functionality
- 🔍 Advanced search and filtering
- 📝 Detailed audit logs
- ⚙️ Platform configuration settings
- 📈 Revenue tracking (if monetization added)
- 🔔 Alert system for suspicious activity

## Support

For admin-related issues:
1. Check this guide
2. Review error messages in console
3. Check API server logs
4. Refer to main documentation

---

**Admin Panel Version**: 1.0.0
**Last Updated**: September 2025
**Access Level**: Admin Only 🛡️
