// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// FAQ accordion
document.querySelectorAll('.faq-q').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var item = btn.closest('.faq-item');
    var wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(function (open) {
      open.classList.remove('open');
    });
    if (!wasOpen) item.classList.add('open');
  });
});
