Quiq.on('init', function(conversation) {
  document.querySelector('.infoText').classList.add('hidden');
  document.querySelector('.conversation').innerText = JSON.stringify(conversation, null, 2);
  document.querySelector('.conversationContainer').classList.remove('hidden');
});

function submitTenant() {
  var tenantInput = document.querySelector('#tenantInput');
  var domain = document.querySelector('.tenantSelect');
  if (!tenantInput.value) return false;

  Quiq.init(`https://${tenantInput.value}${domain.value}`);
  Quiq.prepareMessage('Successfully initialized Quiq UI Extension!');
  document.querySelector('.successText').classList.remove('hidden');
  return false;
}
