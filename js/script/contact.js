/**
 * Contact Us integration (Public).
 * Backend:
 *   GET  /api/contact/info       → { address, email, phone, workingHours, mapEmbedUrl, recaptchaEnabled, recaptchaSiteKey }
 *   POST /api/contact/message    { name, email, subject, message, phone, recaptchaToken }
 */
var jbRecaptchaWidgetId = null;
var jbRecaptchaEnabled = false;

$(document).ready(function ()
{
    // ─── Əlaqə məlumatlarını + xəritə + reCAPTCHA yüklə ───
    loadContactInfo();

    var form = $('#contactApiForm');
    if (!form.length) return;

    var msgBox = $('#contactFormMsg');

    function showMessage(msg, type)
    {
        msgBox.removeClass('alert-success alert-danger')
            .addClass('alert alert-' + (type || 'info')).html(msg).show();
        if (type === 'success') setTimeout(function () { msgBox.fadeOut(300); }, 6000);
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        msgBox.hide();

        var recaptchaToken = null;
        if (jbRecaptchaEnabled && window.grecaptcha && jbRecaptchaWidgetId !== null)
        {
            recaptchaToken = grecaptcha.getResponse(jbRecaptchaWidgetId);
            if (!recaptchaToken)
            {
                showMessage('Zəhmət olmasa "I\'m not a robot" təsdiqini keçin.', 'danger');
                return;
            }
        }

        var payload = {
            name: $('#contactName').val().trim(),
            email: $('#contactEmail').val().trim(),
            subject: ($('#contactSubject').val() || '').trim() || 'Website Contact',
            message: $('#contactMessage').val().trim(),
            phone: ($('#contactPhone').val() || '').trim() || null,
            recaptchaToken: recaptchaToken
        };

        if (!payload.name || !payload.email || !payload.message)
        {
            showMessage('Ad, email və mesaj xanaları tələb olunur.', 'danger');
            return;
        }

        var btn = form.find('button[type="submit"]');
        var original = btn.html();
        btn.prop('disabled', true).html('<span>Göndərilir...</span>');

        apiFetch('/contact/message', { method: 'POST', body: JSON.stringify(payload) })
            .then(function ()
            {
                btn.prop('disabled', false).html(original);
                form[0].reset();
                if (jbRecaptchaEnabled && window.grecaptcha && jbRecaptchaWidgetId !== null)
                    grecaptcha.reset(jbRecaptchaWidgetId);
                showMessage('Mesajınız göndərildi. Tezliklə əlaqə saxlayacağıq.', 'success');
            })
            .catch(function (err)
            {
                btn.prop('disabled', false).html(original);
                if (jbRecaptchaEnabled && window.grecaptcha && jbRecaptchaWidgetId !== null)
                    grecaptcha.reset(jbRecaptchaWidgetId);
                var m = (err && err.data && err.data.error && err.data.error.message) || 'Mesaj göndərilə bilmədi. Yenidən cəhd edin.';
                showMessage(m, 'danger');
            });
    });
});

function loadContactInfo()
{
    if (!$('#contactInfoList').length) return;

    apiFetch('/contact/info', { method: 'GET' })
        .then(function (res)
        {
            var d = (res && res.data) || {};

            if (d.address) $('#ci-address').text(d.address);
            if (d.email)
            {
                $('#ci-email').html('<a href="mailto:' + d.email + '">' + d.email + '</a>');
            }
            if (d.phone)
            {
                $('#ci-phone').html('<a href="tel:' + String(d.phone).replace(/\s+/g, '') + '">' + d.phone + '</a>');
            }
            if (d.workingHours)
            {
                $('#ci-workinghours').text(d.workingHours);
                $('#ci-workinghours-li').show();
            }

            // Google Maps embed
            if (d.mapEmbedUrl)
            {
                $('#contactMap').attr('src', d.mapEmbedUrl);
            }

            // reCAPTCHA
            jbRecaptchaEnabled = !!d.recaptchaEnabled && !!d.recaptchaSiteKey;
            if (jbRecaptchaEnabled)
            {
                renderRecaptcha(d.recaptchaSiteKey);
            }
        })
        .catch(function (err)
        {
            console.error('Contact info yüklənə bilmədi:', err);
        });
}

/**
 * grecaptcha API hazır olana qədər gözləyib widget-i render edir.
 */
function renderRecaptcha(siteKey, attempt)
{
    attempt = attempt || 0;
    if (!$('#contactRecaptcha').length) return;

    if (!window.grecaptcha || !grecaptcha.render)
    {
        if (attempt > 40) return; // ~10s timeout
        return setTimeout(function () { renderRecaptcha(siteKey, attempt + 1); }, 250);
    }

    if (jbRecaptchaWidgetId !== null) return; // artıq render olunub
    try
    {
        jbRecaptchaWidgetId = grecaptcha.render('contactRecaptcha', { sitekey: siteKey });
    }
    catch (e)
    {
        console.error('reCAPTCHA render xətası:', e);
    }
}
