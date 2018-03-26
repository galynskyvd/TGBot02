const request = require('axios');
const {api: {host}} = require('../config');

const methods = {
	checkUser: async userId => await request.post(`${host}/checkUser`, {userId}),
	registrationUser: async (userId) => await request.post(`${host}/registrationUser`, {userId}),
	getIndex: async userId => await request.post(`${host}/getIndex`, {userId}),
	addIndex: async userId => await request.post(`${host}/addIndex`, {userId}),
	updateIndex: async (userId, index) => await request.post(`${host}/updateIndex`, {userId, index}),
	addAnswer: async (userId, index, message, variant) => await request.post(`${host}/addAnswer`, {userId, index, message, variant}),
	getAnswer: async (userId, variant) => await request.post(`${host}/getAnswer`, {userId, variant}),
	doneSurvey: async userId => await request.post(`${host}/doneSurvey`, {userId}),
	getQuestion: async (index, variant) => await request.post(`${host}/getQuestion`, {index, variant}),
	changeVariant: async (userId, variant) => await request.post(`${host}/changeVariant`, {userId, variant})
};

module.exports = methods;
