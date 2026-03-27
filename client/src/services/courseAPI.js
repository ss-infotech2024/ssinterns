import API from "./api.js";

export const courseAPI = {
    // Course endpoints
    getAllCourses: async () => {
        try {
            const response = await API.get('/courses');
            return response.data;
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed. Please login again.');
            }
            throw new Error(error.response?.data?.message || 'Failed to fetch courses');
        }
    },

    createCourse: async (courseData) => {
        try {
            const response = await API.post('/courses', courseData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to create course');
        }
    },

    updateCourse: async (courseId, courseData) => {
        try {
            const response = await API.put(`/courses/${courseId}`, courseData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update course');
        }
    },

    deleteCourse: async (courseId) => {
        try {
            const response = await API.delete(`/courses/${courseId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete course');
        }
    },

    // Student endpoints
    addStudent: async (courseId, studentData) => {
        try {
            const response = await API.post(`/courses/${courseId}/students`, studentData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to add student');
        }
    },

    updateStudent: async (courseId, studentId, studentData) => {
        try {
            const response = await API.put(`/courses/${courseId}/students/${studentId}`, studentData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update student');
        }
    },

    deleteStudent: async (courseId, studentId) => {
        try {
            const response = await API.delete(`/courses/${courseId}/students/${studentId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to delete student');
        }
    },

    updateReminder: async (courseId, studentId, reminderMessage) => {
        try {
            const response = await API.patch(`/courses/${courseId}/students/${studentId}/reminder`, {
                reminderMessage
            });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to update reminder');
        }
    },

    // Get course analytics
    getCourseAnalytics: async () => {
        try {
            const response = await API.get('/courses/analytics');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Failed to fetch analytics');
        }
    }
};