import Fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: true
});

const notifications = [];

fastify.post('/push', async (request, reply) => {
  const notification = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    data: request.body,
    headers: request.headers,
    query: request.query
  };

  notifications.unshift(notification);

  if (notifications.length > 1000) {
    notifications.pop();
  }

  fastify.log.info(`Nouvelle notification reçue: ${notification.id}`);

  return {
    success: true,
    message: 'Notification capturée',
    id: notification.id
  };
});

fastify.get('/messages', async (request, reply) => {
  const limit = parseInt(request.query.limit) || 100;
  const offset = parseInt(request.query.offset) || 0;

  return {
    total: notifications.length,
    limit,
    offset,
    notifications: notifications.slice(offset, offset + limit)
  };
});

fastify.get('/dashboard', async (request, reply) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Push Notification Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        header {
            background: white;
            padding: 20px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }

        h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }

        .stats {
            display: flex;
            gap: 20px;
            margin-top: 15px;
        }

        .stat-item {
            background: #f7fafc;
            padding: 10px 20px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }

        .stat-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #2d3748;
            margin-top: 5px;
        }

        .controls {
            background: white;
            padding: 15px 30px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
        }

        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background 0.3s;
        }

        button:hover {
            background: #5568d3;
        }

        button.danger {
            background: #f56565;
        }

        button.danger:hover {
            background: #e53e3e;
        }

        .auto-refresh {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
        }

        .auto-refresh label {
            font-size: 14px;
            color: #4a5568;
        }

        input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }

        .notifications {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .notification {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            transition: transform 0.2s, box-shadow 0.2s;
        }

        .notification:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .notification-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #edf2f7;
        }

        .notification-id {
            font-size: 14px;
            font-weight: 600;
            color: #667eea;
        }

        .notification-time {
            font-size: 13px;
            color: #718096;
        }

        .notification-content {
            margin-bottom: 10px;
        }

        .section-title {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
        }

        pre {
            background: #f7fafc;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 13px;
            line-height: 1.5;
            border: 1px solid #e2e8f0;
        }

        .empty-state {
            background: white;
            padding: 60px 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .empty-state-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }

        .empty-state-title {
            font-size: 24px;
            color: #2d3748;
            margin-bottom: 10px;
        }

        .empty-state-text {
            color: #718096;
            font-size: 16px;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .notification {
            animation: slideIn 0.3s ease-out;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>📬 Push Notification Dashboard</h1>
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-label">Total Notifications</div>
                    <div class="stat-value" id="total-count">0</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Last Update</div>
                    <div class="stat-value" id="last-update">-</div>
                </div>
            </div>
        </header>

        <div class="controls">
            <button onclick="refreshNotifications()">🔄 Refresh</button>
            <button class="danger" onclick="clearNotifications()">🗑️ Clear All</button>
            <div class="auto-refresh">
                <input type="checkbox" id="auto-refresh" onchange="toggleAutoRefresh()">
                <label for="auto-refresh">Auto-refresh (5s)</label>
            </div>
        </div>

        <div class="notifications" id="notifications-container">
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No Notifications</div>
                <div class="empty-state-text">Push notifications will appear here when received</div>
            </div>
        </div>
    </div>

    <script>
        let autoRefreshInterval = null;

        async function refreshNotifications() {
            try {
                const response = await fetch('/messages');
                const data = await response.json();
                
                console.log('Données reçues:', data);

                const container = document.getElementById('notifications-container');
                const totalCount = document.getElementById('total-count');
                const lastUpdate = document.getElementById('last-update');

                totalCount.textContent = data.total;
                lastUpdate.textContent = new Date().toLocaleTimeString('en-US');

                if (data.notifications.length === 0) {
                    container.innerHTML = '<div class="empty-state">' +
                        '<div class="empty-state-icon">📭</div>' +
                        '<div class="empty-state-title">No Notifications</div>' +
                        '<div class="empty-state-text">Push notifications will appear here when received</div>' +
                        '</div>';
                } else {
                    container.innerHTML = data.notifications.map(function(notif) {
                        var queryHtml = Object.keys(notif.query).length > 0
                            ? '<div class="notification-content">' +
                              '<div class="section-title">🔍 Query Parameters</div>' +
                              '<pre>' + JSON.stringify(notif.query, null, 2) + '</pre>' +
                              '</div>'
                            : '';

                        return '<div class="notification">' +
                            '<div class="notification-header">' +
                            '<span class="notification-id">ID: ' + notif.id + '</span>' +
                            '<span class="notification-time">' + new Date(notif.timestamp).toLocaleString('en-US') + '</span>' +
                            '</div>' +
                            '<div class="notification-content">' +
                            '<div class="section-title">📦 Data (Body)</div>' +
                            '<pre>' + JSON.stringify(notif.data, null, 2) + '</pre>' +
                            '</div>' +
                            '<div class="notification-content">' +
                            '<div class="section-title">🔖 Headers</div>' +
                            '<pre>' + JSON.stringify(notif.headers, null, 2) + '</pre>' +
                            '</div>' +
                            queryHtml +
                            '</div>';
                    }).join('');
                }
            } catch (error) {
                console.error('Error refreshing notifications:', error);
            }
        }

        async function clearNotifications() {
            if (confirm('Are you sure you want to clear all notifications?')) {
                try {
                    await fetch('/messages', { method: 'DELETE' });
                    refreshNotifications();
                } catch (error) {
                    console.error('Error clearing notifications:', error);
                }
            }
        }

        function toggleAutoRefresh() {
            const checkbox = document.getElementById('auto-refresh');

            if (checkbox.checked) {
                autoRefreshInterval = setInterval(refreshNotifications, 5000);
            } else {
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                }
            }
        }

        refreshNotifications();
    </script>
</body>
</html>
  `;

  reply.type('text/html').send(html);
});

fastify.delete('/messages', async (request, reply) => {
  const count = notifications.length;
  notifications.length = 0;

  return {
    success: true,
    message: `${count} notification(s) effacée(s)`
  };
});

const start = async () => {
  try {
    await fastify.listen({ port: 6555, host: '0.0.0.0' });
    console.log('🚀 Serveur démarré sur http://localhost:6555');
    console.log('📬 Dashboard disponible sur http://localhost:6555/dashboard');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
