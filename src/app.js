const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const {bot: {host, port, token}} = require('./config');
const Api = require('./api');

const bot = new TelegramBot(token);
const app = express();

bot.setWebHook(`${host}/bot${token}`);

app.use(bodyParser.json());

app.post(`/bot${token}`, (req, res) => {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

app.listen(port, () => {
	console.log(`Express server is listening on ${port}`);
});

const messages = [
	'Привет. Ответьте на пару вопросов.',
	'Спасибо что ответили на наши вопросы. Хорошего дня!'
];

const getChat = msg => msg.hasOwnProperty('chat') ? msg.chat.id : msg.from.id;

const sendMessage = (msg, index) => {
	const message = messages[index];
	const chat = getChat(msg);

	bot.sendMessage(chat, message);
};

const sendNotify = (users, answers, {id, first_name}) => {
	const convertAnswers = answers.map(({title, message}, index) => (
		[`<b>${index + 1}. ${title}</b>\n${message}\n`]
	)).join('');

	const result = `<b>Новый отзыв:</b>\nПользователь <a href='tg://user?id=${id}'>${first_name}</a> ответил на вопросы.\n${convertAnswers}`;

	users.forEach(({user_id}) => {
		bot.sendMessage(user_id, result, {parse_mode: 'html'});
	});
};

const newQuestion = (msg, title, variants = undefined) => {
	const chat = getChat(msg);

	if (variants) {
		const buttons = variants && variants.map((item) => ({
			text: item,
			callback_data: item
		}));

		const options = {
			reply_markup: JSON.stringify({
				inline_keyboard: [buttons],
				parse_mode: 'Markdown'
			})
		};

		bot.sendMessage(chat, title, options);
	} else {
		bot.sendMessage(chat, title);
	}
};

bot.on('message', async (msg) => {
	const {from: {id, first_name}, text} = msg;
	const {data: {status}} = await Api.checkUser(id);
	const {data: {index, is_done, variant}} = await Api.getIndex(id);
	const {data: {title, variants}} = await Api.getQuestion(index, variant);

	if (!status) {
		await Api.registrationUser(id);
		await Api.addIndex(id);
		//sendMessage(msg, 0);
		newQuestion(msg, title, variants);
	} else {
		if (is_done) {
			sendMessage(msg, 1);
		} else {
			if (title) {
				await Api.addAnswer(id, index - 2, text, variant);
				await Api.updateIndex(id, index + 1);
				newQuestion(msg, title);
			} else {
				await Api.doneSurvey(id);
				await Api.addAnswer(id, index - 2, text, variant);
				const {data: {users, answers}} = await Api.getAnswer(id, variant);

				sendNotify(users, answers, {id, first_name});
				sendMessage(msg, 1);
			}
		}
	}
});

bot.on('callback_query', async (msg) => {
	const {from: {id}} = msg;
	const answer = msg.data;
	const variantAnswer = answer === 'Да' ? 1 : 2;
	const {data: {status}} = await Api.changeVariant(id, variantAnswer);
	const {data: {index, variant}} = await Api.getIndex(id);
	const {data: {title}} = await Api.getQuestion(index, variant);

	await Api.addAnswer(id, index - 1, answer, 0);
	await Api.updateIndex(id, index + 1);
	newQuestion(msg, title);

	bot.answerCallbackQuery(msg.id, '', false);
});