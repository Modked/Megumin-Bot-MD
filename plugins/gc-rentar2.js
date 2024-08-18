import db from '../lib/database.js';

let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})( [0-9]{1,3})?/i;

let handler = async (m, { conn, text }) => {
	if (!text) {
		return m.reply(m.chat, '> _📝 Ingresa el link del grupo para rentar el bot._', m, rcanal);
	}

	let userRents = global.db.data.userRents[m.sender];
	if (!userRents || userRents.tokens <= 0) {
		return m.reply(m.chat, '❎ No tienes tokens disponibles para rentar el bot. Compra más tokens con /rentar.', m, rcanal);
	}

	if (!linkRegex.test(text)) {
		return m.reply(m.chat, '🚩 Enlace inválido.', m, rcanal);
	}

	let [_, code] = text.match(linkRegex) || [];
	if (!code) {
		return m.reply(m.chat, '🚩 Enlace inválido.', m, rcanal);
	}

	let groupMetadata;
	try {
		groupMetadata = await conn.groupAcceptInvite(code);
	} catch (e) {
		return m.reply(m.chat, '❌ No pude unirme al grupo. Verifica el enlace.', m, rcanal);
	}

	let groupId = groupMetadata.id || groupMetadata;
	if (!groupId.toString().endsWith('@g.us')) {
		return m.reply(m.chat, '❌ No se pudo identificar el grupo.', m, rcanal);
	}

	global.db.data.groupRents = global.db.data.groupRents || {};
	global.db.data.groupRents[groupId] = {
		user: m.sender,
		tokenCount: userRents.tokens,
		startTime: Date.now(),
		duration: userRents.tokens * 24 * 60 * 60 * 1000,
	};
	userRents.tokens = 0;
	userRents.groups.push(groupId);

	conn.reply(m.chat, `> _📝 Me uní correctamente al grupo_ *${groupId}* por ${global.db.data.groupRents[groupId].tokenCount} día(s).`, m, rcanal);

	let chats = global.db.data.chats[groupId] || {};
	chats.expired = global.db.data.groupRents[groupId].startTime + global.db.data.groupRents[groupId].duration;
	global.db.data.chats[groupId] = chats;

	let pp = 'https://telegra.ph/file/32e696946433c03588726.mp4';
	await conn.sendMessage(groupId, { video: { url: pp }, gifPlayback: true, caption: '> ¡Ya llegué! El bot estará disponible por el tiempo acordado.', mentions: [m.sender] });
};

handler.tags = ['grupos']
handler.help = ['rentar2 *<link>*']
handler.command = ['rentar2']

export default handler