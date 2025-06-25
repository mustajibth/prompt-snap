document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const scanBtn = document.getElementById('scanBtn');
  const toggleKeyBtn = document.getElementById('toggleKey');
  const resultsList = document.getElementById('resultsList');
  const resultsSection = document.getElementById('results');

  // Toggle API key visibility
  toggleKeyBtn.addEventListener('click', () => {
    apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
  });

  // Scan page
  scanBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, {
      action: 'scanImages',
      settings: {} // Bisa diisi model atau custom prompt nanti
    }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Gagal menghubungi tab. Pastikan halaman Adobe Stock sudah terbuka.');
        return;
      }

      // Tampilkan hasil sementara
      resultsSection.style.display = 'block';
      resultsList.innerHTML = '<p>📸 Memproses gambar... tunggu sebentar.</p>';
    });
  });
});