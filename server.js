const os = require('os');
const http = require('http').createServer();
const io = require('socket.io')(http, {
    cors: { origin: "*" },
    allowEIO3: true
});

let activeUsers = new Map();

// === TEŞHİS (DIAGNOSTİK) MODÜLÜ ===
io.engine.on("connection_error", (err) => {
    console.error("❌ [MOTOR HATASI] Bağlantı reddedildi!");
    console.error("   ➤ Sebep:", err.code);
    console.error("   ➤ Mesaj:", err.message);
});

io.on('connection', (socket) => {
    console.log(`\n🟢 [BAĞLANTI] Bir cihaz frekansa bağlandı. ID: ${socket.id}`);

    socket.on('join_network', (userData) => {
        userData.socketId = socket.id;
        activeUsers.set(socket.id, userData);
        console.log(`[AĞA KATILIM] ${userData.nickname} [${userData.role}] giriş yaptı.`);
        io.emit('user_list_changed', Array.from(activeUsers.values()));
    });

    socket.on('send_message', (data) => {
        console.log(`[MESAJ] ${data.sender}: ${data.text}`);
        io.emit('receive_message', data);
    });

    // === SES DAĞITIM MOTORU (GARANTİLİ YÖNTEM) ===
    socket.on('audio_stream', (base64Data) => {
    // Gelen güvenli Base64 metnini odadaki diğer subaylara aynen fırlatıyoruz
    socket.broadcast.emit('audio_receive', {
        senderId: socket.id,
        buffer: base64Data
    });
    });

    socket.on('disconnect', (reason) => {
        if (activeUsers.has(socket.id)) {
            const user = activeUsers.get(socket.id);
            console.log(`🔴 [AYRILMA] ${user.nickname} çıktı. Sebep: ${reason}`);
            activeUsers.delete(socket.id);
            io.emit('user_list_changed', Array.from(activeUsers.values()));
        }
    });
});

// === SUNUCU AYAĞA KALKIYOR (DİNAMİK PORT VE LOGLAMA) ===
const PORT = process.env.PORT || 3712; 

http.listen(PORT, '0.0.0.0', () => {
    // 1. Bilgisayarın yerel (Local) IPv4 adresini bulma
    let localIP = 'localhost';
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const net of networkInterfaces[interfaceName]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIP = net.address;
            }
        }
    }

    // 2. Railway vb. platformların atadığı domain'i yakalama
    const externalDomain = process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
        : `Dış domain bulunamadı (Yerel ağdasın)`;

    // 3. Ekrana yazdırma
    console.log("==================================================");
    console.log("        BEARPAW TELSİZ KULESİ YAYINDA           ");
    console.log("==================================================");
    console.log(`🚪 Dinlenen Port   : ${PORT}`);
    console.log(`🏠 Yerel IP (Ev)   : http://${localIP}:${PORT}`);
    console.log(`🌍 Dış Adres (Web) : ${externalDomain}`);
    console.log("==================================================");
});