document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('checkForm');
    const urlInput = document.getElementById('url');
    const historyTableBody = document.getElementById('historyTableBody');
    const submitBtn = document.getElementById('submitBtn');
    const emptyState = document.getElementById('emptyState');
    const clockEl = document.getElementById('liveClock');

    // Live clock function
    function updateClock() {
        const now = new Date();
        const utcDate = now.toISOString().split('T')[0];
        const utcTime = now.toISOString().split('T')[1].split('.')[0];
        clockEl.textContent = `${utcDate} ${utcTime} UTC`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Fetch initial history
    fetchHistory();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = urlInput.value.trim();
        if (!url) return;

        setLoading(true);

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            renderHistory(data.history);
        } catch (error) {
            console.error('Failed to perform check:', error);
            alert('Failed to contact Sentinel Server.');
        } finally {
            setLoading(false);
        }
    });

    async function fetchHistory() {
        try {
            const response = await fetch('/api/history');
            const history = await response.json();
            renderHistory(history);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    }

    function setLoading(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'SCANNING...';
            submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'RUN CHECK';
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }

    function renderHistory(history) {
        if (!history || history.length === 0) {
            emptyState.style.display = 'block';
            historyTableBody.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        historyTableBody.innerHTML = '';

        history.forEach((check, index) => {
            const row = document.createElement('tr');
            
            // Format timestamp (e.g. 4:51:08 PM)
            const date = new Date(check.timestamp);
            const timeString = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
            
            // Format URL
            let shortUrl = check.url;
            if (shortUrl.length > 50) shortUrl = shortUrl.substring(0, 47) + '...';

            const isUp = check.status === 'UP';
            const statusColor = isUp ? 'text-emerald-400' : 'text-red-400';
            const dotBg = isUp ? 'bg-emerald-500' : 'bg-red-500';
            const codeColor = check.statusCode && check.statusCode >= 200 && check.statusCode < 300 ? 'text-emerald-400' : 'text-red-400';
            const statusCodeObj = check.statusCode ? check.statusCode : '-';

            // Glow for row items
            row.className = index === 0 ? "bg-slate-800/40" : "hover:bg-slate-800/20 transition-colors";

            row.innerHTML = `
                <td class="py-4 px-4 font-bold ${statusColor}">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full ${dotBg}"></div>
                        <span>${check.status}</span>
                    </div>
                </td>
                <td class="py-4 px-4 text-slate-300 truncate max-w-[300px]" title="${check.url}">${shortUrl}</td>
                <td class="py-4 px-4 text-center font-bold ${codeColor}">${statusCodeObj}</td>
                <td class="py-4 px-4 text-slate-400 text-right">${check.latency} ms</td>
                <td class="py-4 px-4 text-slate-500 text-right text-xs">${timeString}</td>
            `;

            historyTableBody.appendChild(row);
        });
    }
});
