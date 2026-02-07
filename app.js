// Init Data
let transactions = JSON.parse(localStorage.getItem('theH_data')) || [];
const balanceEl = document.getElementById('net-balance');

// Chart Setup
const ctx = document.getElementById('hisaabChart').getContext('2d');
let hisaabChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: ['Income', 'Expense'],
        datasets: [{
            data: [0, 0],
            backgroundColor: ['#10b981', '#ef4444'],
            borderWidth: 0
        }]
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }
});

// --- CORE FUNCTIONS ---

function updateUI(filterText = '') {
    const creditList = document.getElementById('credit-list');
    const debitList = document.getElementById('debit-list');
    let totalC = 0, totalD = 0;

    creditList.innerHTML = ''; debitList.innerHTML = '';

    transactions.forEach((t) => {
        // Search Logic
        if (t.name.toLowerCase().includes(filterText.toLowerCase())) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${t.name}</span> <span>₹${t.amount}</span>`;
            
            if (t.type === 'credit') {
                creditList.appendChild(li);
                totalC += t.amount;
            } else {
                debitList.appendChild(li);
                totalD += t.amount;
            }
        }
    });

    // Update Totals (Only from full list for accuracy)
    const realTotalC = transactions.filter(t=>t.type==='credit').reduce((s,t)=>s+t.amount,0);
    const realTotalD = transactions.filter(t=>t.type==='debit').reduce((s,t)=>s+t.amount,0);

    balanceEl.innerText = `₹${realTotalC - realTotalD}`;
    hisaabChart.data.datasets[0].data = [realTotalC, realTotalD];
    hisaabChart.update();
}

function addEntry(name, amount, type) {
    transactions.push({ name, amount, type, date: new Date().toISOString() });
    localStorage.setItem('theH_data', JSON.stringify(transactions));
    updateUI();
}

// --- EVENT LISTENERS ---

// 1. Manual Entry
document.getElementById('enter-btn').onclick = () => {
    const raw = document.getElementById('manual-input').value;
    const parts = raw.split(','); // Expecting "Coffee, 50"
    if (parts.length === 2) {
        const type = confirm("Press OK for CREDIT (Income)\nPress Cancel for DEBIT (Expense)") ? 'credit' : 'debit';
        addEntry(parts[0].trim(), parseInt(parts[1].trim()), type);
        document.getElementById('manual-input').value = '';
    } else {
        alert("Format: Name, Amount (e.g., 'Taxi, 200')");
    }
};

// 2. Search Bar
document.getElementById('search-input').addEventListener('input', (e) => {
    updateUI(e.target.value);
});

// 3. Mic Logic (Web Speech API)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'hi-IN'; // Optimized for India

document.getElementById('mic-btn').onclick = () => {
    document.getElementById('status-msg').style.color = '#10b981';
    document.getElementById('status-msg').innerText = "Listening...";
    recognition.start();
};

recognition.onresult = (e) => {
    const speech = e.results[0][0].transcript;
    document.getElementById('status-msg').innerText = `Heard: "${speech}"`;
    document.getElementById('status-msg').style.color = '#fff';
    
    // Auto-extract logic
    const nums = speech.match(/\d+/);
    if (nums) {
        const amount = parseInt(nums[0]);
        const name = speech.replace(nums[0], '').replace('rupees', '').trim();
        const type = confirm(`Add "${name}" of ₹${amount}?\nOK = Credit, Cancel = Debit`) ? 'credit' : 'debit';
        addEntry(name, amount, type);
    }
};

// 4. Chatbot Logic
function toggleChat() {
    const widget = document.getElementById('hbot-widget');
    const icon = document.getElementById('toggle-icon');
    widget.classList.toggle('closed');
    icon.classList.toggle('fa-chevron-down');
    icon.classList.toggle('fa-chevron-up');
}

document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const q = e.target.value.toLowerCase();
        const chatBox = document.getElementById('chat-display');
        
        // User Msg
        chatBox.innerHTML += `<div style="text-align:right; margin:5px; color:#a5b4fc;">${e.target.value}</div>`;
        
        // Bot Logic
        let reply = "I can only read your balance or total expenses.";
        if (q.includes('balance') || q.includes('paise')) {
            reply = `Your current Net Balance is ${balanceEl.innerText}`;
        } else if (q.includes('expense') || q.includes('kharcha')) {
            const exp = transactions.filter(t => t.type === 'debit').reduce((a,b)=>a+b.amount,0);
            reply = `Total Kharcha is ₹${exp}`;
        }
        
        // Bot Msg
        setTimeout(() => {
            chatBox.innerHTML += `<div class="bot-msg">${reply}</div>`;
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 500);
        
        e.target.value = '';
    }
});

// Initial Load
updateUI();
