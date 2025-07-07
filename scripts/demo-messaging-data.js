const Database = require('../db');

const createDemoMessagingData = async () => {
    const db = new Database();
    let connection;
    
    try {
        console.log('🔄 Creating demo messaging data...');
        connection = await db.pool.getConnection();
        
        // Create additional conversations for better demo
        
        // 1. Parent-to-parent conversation (cross-family)
        console.log('Creating parent-to-parent conversation...');
        const parentConversation = await connection.query(`
            INSERT INTO conversations (type, title, description, created_by) 
            VALUES ('group', 'Ouders Support Groep', 'Ervaringen delen over opvoeding', 1)
        `);
        
        const parentConvId = parentConversation[0].insertId;
        
        // Add participants (parents from different families)
        await connection.query(`
            INSERT INTO conversation_participants (conversation_id, user_id, role) 
            VALUES 
                (${parentConvId}, 1, 'admin'),
                (${parentConvId}, 2, 'member'),
                (${parentConvId}, 5, 'member'),
                (${parentConvId}, 6, 'member')
        `);
        
        // Add some messages to parent conversation
        const parentMessages = [
            'Welkom in onze ouders support groep! Hier kunnen we ervaringen delen.',
            'Hoi allemaal! Fijn om hier te zijn. Hebben jullie tips voor huiswerk motivatie?',
            'Bij ons werkt een beloning systeem heel goed. Voor elke 5 huiswerk sessies krijgen ze een kleine beloning.',
            'Dat is een goed idee! Wij gebruiken een punten systeem via deze app.',
            'Ja, PointsFam werkt super goed voor ons gezin. De kinderen zijn veel gemotiveerder.',
            'Misschien kunnen we een keer afspreken om meer tips uit te wisselen?'
        ];
        
        const senders = [1, 5, 2, 6, 1, 5]; // Alternate between different parents
        
        for (let i = 0; i < parentMessages.length; i++) {
            await connection.query(`
                INSERT INTO messages (conversation_id, sender_id, content, created_at) 
                VALUES (${parentConvId}, ${senders[i]}, ?, DATE_SUB(NOW(), INTERVAL ${parentMessages.length - i} HOUR))
            `, [parentMessages[i]]);
        }
        
        // 2. Direct conversation between parent and child
        console.log('Creating parent-child direct conversation...');
        const directConvId = await db.findOrCreateDirectConversation(1, 3);
        
        const parentChildMessages = [
            { sender: 1, content: 'Hoi Emma! Hoe ging het op school vandaag?' },
            { sender: 3, content: 'Hey papa! Het was goed. We hadden een leuke les over dieren.' },
            { sender: 1, content: 'Dat klinkt leuk! Wat voor dieren hebben jullie geleerd?' },
            { sender: 3, content: 'Over dolfijnen! Wist je dat ze heel slim zijn?' },
            { sender: 1, content: 'Ja, dolfijnen zijn inderdaad heel intelligent. Heb je al je huiswerk af?' },
            { sender: 3, content: 'Bijna! Nog even rekenen en dan ben ik klaar.' },
            { sender: 1, content: 'Goed bezig! Als je klaar bent krijg je 15 punten erbij.' }
        ];
        
        for (let i = 0; i < parentChildMessages.length; i++) {
            const msg = parentChildMessages[i];
            await connection.query(`
                INSERT INTO messages (conversation_id, sender_id, content, created_at) 
                VALUES (${directConvId}, ${msg.sender}, ?, DATE_SUB(NOW(), INTERVAL ${(parentChildMessages.length - i) * 10} MINUTE))
            `, [msg.content]);
        }
        
        // 3. Group conversation between children
        console.log('Creating children group conversation...');
        const childrenConversation = await connection.query(`
            INSERT INTO conversations (type, title, description, family_id, created_by) 
            VALUES ('group', 'Kids Corner', 'Gesprek voor alle kinderen', 1, 3)
        `);
        
        const childrenConvId = childrenConversation[0].insertId;
        
        // Add child participants
        await connection.query(`
            INSERT INTO conversation_participants (conversation_id, user_id, role) 
            VALUES 
                (${childrenConvId}, 3, 'admin'),
                (${childrenConvId}, 4, 'member'),
                (${childrenConvId}, 7, 'member'),
                (${childrenConvId}, 8, 'member')
        `);
        
        // Add some fun children messages
        const childrenMessages = [
            { sender: 3, content: 'Hoi iedereen! Wie heeft er zin om samen een spelletje te spelen?' },
            { sender: 4, content: 'Ik! Wat voor spelletje?' },
            { sender: 7, content: 'Misschien verstoppertje in de tuin?' },
            { sender: 8, content: 'Of we kunnen bouwen met LEGO!' },
            { sender: 3, content: 'LEGO is altijd goed! Ik heb nieuwe steentjes gekregen.' },
            { sender: 4, content: 'Cool! Kunnen we een kasteel bouwen?' },
            { sender: 7, content: 'En ik maak een draak erbij! 🐉' },
            { sender: 8, content: 'Haha dat wordt epic!' }
        ];
        
        for (let i = 0; i < childrenMessages.length; i++) {
            const msg = childrenMessages[i];
            await connection.query(`
                INSERT INTO messages (conversation_id, sender_id, content, created_at) 
                VALUES (${childrenConvId}, ${msg.sender}, ?, DATE_SUB(NOW(), INTERVAL ${(childrenMessages.length - i) * 5} MINUTE))
            `, [msg.content]);
        }
        
        // 4. Add more messages to existing family conversation
        console.log('Adding more messages to family conversation...');
        const familyMessages = [
            { sender: 1, content: 'Goedemorgen allemaal! Vandaag is het zaterdag, wie heeft er zin in een uitje?' },
            { sender: 2, content: 'Dat klinkt leuk! Misschien naar het park?' },
            { sender: 3, content: 'Ja! En kunnen we ijsjes kopen?' },
            { sender: 4, content: 'En voetballen in het park?' },
            { sender: 1, content: 'Natuurlijk! Als jullie eerst je kamers opruimen, krijgen jullie extra punten.' },
            { sender: 3, content: 'Oké papa, ik ga meteen beginnen!' },
            { sender: 4, content: 'Ik ook! Wedstrijdje wie het eerst klaar is?' },
            { sender: 2, content: 'Haha, ze zijn al weg! Dat punten systeem werkt echt goed.' },
            { sender: 1, content: 'Zeker weten! En ze leren er verantwoordelijkheid van.' }
        ];
        
        for (let i = 0; i < familyMessages.length; i++) {
            const msg = familyMessages[i];
            await connection.query(`
                INSERT INTO messages (conversation_id, sender_id, content, created_at) 
                VALUES (1, ${msg.sender}, ?, DATE_SUB(NOW(), INTERVAL ${(familyMessages.length - i) * 3} MINUTE))
            `, [msg.content]);
        }
        
        // 5. Create a cross-family conversation (WISH feature)
        console.log('Creating cross-family conversation...');
        const crossFamilyConversation = await connection.query(`
            INSERT INTO conversations (type, title, description, created_by) 
            VALUES ('cross_family', 'Buurt Families', 'Gesprek tussen families uit de buurt', 1)
        `);
        
        const crossFamilyConvId = crossFamilyConversation[0].insertId;
        
        // Add participants from both families
        await connection.query(`
            INSERT INTO conversation_participants (conversation_id, user_id, role) 
            VALUES 
                (${crossFamilyConvId}, 1, 'admin'),
                (${crossFamilyConvId}, 2, 'member'),
                (${crossFamilyConvId}, 5, 'member'),
                (${crossFamilyConvId}, 6, 'member'),
                (${crossFamilyConvId}, 3, 'member'),
                (${crossFamilyConvId}, 7, 'member')
        `);
        
        // Add cross-family messages showcasing WISH features
        const crossFamilyMessages = [
            { sender: 1, content: 'Hallo buren! Wat fijn dat we nu ook via de app kunnen communiceren.' },
            { sender: 5, content: 'Ja, super handig! Hoe gaat het met jullie punten systeem?' },
            { sender: 2, content: 'Heel goed! De kinderen zijn veel meer gemotiveerd om te helpen.' },
            { sender: 6, content: 'Bij ons ook. Lisa heeft deze week al 150 punten verdiend!' },
            { sender: 3, content: 'Wow Lisa, dat is veel! Ik heb er 120 😊' },
            { sender: 7, content: 'Hehe, en ik heb er 200! 😎' },
            { sender: 1, content: 'Haha, het wordt een wedstrijdje tussen de kinderen!' },
            { sender: 5, content: 'Misschien kunnen we een buurt-activiteit organiseren?' },
            { sender: 2, content: 'Goed idee! Een soort punten-toernooi voor alle kinderen?' },
            { sender: 6, content: 'Ja! Met verschillende taken en uitdagingen.' }
        ];
        
        for (let i = 0; i < crossFamilyMessages.length; i++) {
            const msg = crossFamilyMessages[i];
            await connection.query(`
                INSERT INTO messages (conversation_id, sender_id, content, created_at) 
                VALUES (${crossFamilyConvId}, ${msg.sender}, ?, DATE_SUB(NOW(), INTERVAL ${(crossFamilyMessages.length - i) * 2} MINUTE))
            `, [msg.content]);
        }
        
        console.log('✅ Demo messaging data created successfully!');
        console.log('');
        console.log('📊 Demo Data Summary:');
        console.log('• Familie Chat: Familie gesprek met recente berichten');
        console.log('• Ouders Support Groep: Cross-family parent communication');
        console.log('• Direct berichten: Parent-child private conversations');
        console.log('• Kids Corner: Group chat for children');
        console.log('• Buurt Families: Cross-family communication (WISH feature)');
        console.log('');
        console.log('🔗 Features demonstrated:');
        console.log('• Parent-to-parent communication (WannaHave)');
        console.log('• Parent-to-child communication (WannaHave)');
        console.log('• Family group chats (WannaHave)');
        console.log('• Cross-family communication (WISH)');
        console.log('• Real-time messaging interface');
        console.log('• Message grouping and timestamps');
        console.log('• Unread message indicators');
        console.log('• Mobile-responsive design');
        
    } catch (error) {
        console.error('❌ Error creating demo messaging data:', error);
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Run if called directly
if (require.main === module) {
    createDemoMessagingData()
        .then(() => {
            console.log('🎉 Demo messaging data creation completed!');
            console.log('💡 Visit http://localhost:3000/messages to test the messaging center');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Failed to create demo messaging data:', error);
            process.exit(1);
        });
}

module.exports = createDemoMessagingData; 