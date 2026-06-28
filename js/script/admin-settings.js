/**
 * Admin — Site Settings.
 * Backend:
 *   GET /api/admin/settings
 *   PUT /api/admin/settings  { contactAddress, contactEmail, contactPhone, contactWorkingHours,
 *                              mapEmbedUrl, recaptchaEnabled, recaptchaSiteKey }
 */
$(document).ready(function ()
{
    var form = $('#settingsForm');
    if (!form.length) return;

    var alertBox = $('#settingsAlert');

    function showAlert(msg, type)
    {
        alertBox.removeClass('alert-success alert-danger')
            .addClass('alert alert-' + type).html(msg).show();
        if (type === 'success') setTimeout(function () { alertBox.fadeOut(300); }, 5000);
    }

    function loadSettings()
    {
        apiFetch('/admin/settings')
            .then(function (res)
            {
                var d = (res && res.data) || {};
                $('#setAddress').val(d.contactAddress || '');
                $('#setEmail').val(d.contactEmail || '');
                $('#setPhone').val(d.contactPhone || '');
                $('#setWorkingHours').val(d.contactWorkingHours || '');
                $('#setMapEmbedUrl').val(d.mapEmbedUrl || '');
                $('#setRecaptchaEnabled').val(d.recaptchaEnabled ? 'true' : 'false');
                $('#setRecaptchaSiteKey').val(d.recaptchaSiteKey || '');
            })
            .catch(function (err)
            {
                console.error('Settings load error:', err);
                showAlert('Parametrlər yüklənə bilmədi.', 'danger');
            });
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        alertBox.hide();

        var payload = {
            contactAddress: $('#setAddress').val().trim(),
            contactEmail: $('#setEmail').val().trim(),
            contactPhone: $('#setPhone').val().trim(),
            contactWorkingHours: $('#setWorkingHours').val().trim(),
            mapEmbedUrl: $('#setMapEmbedUrl').val().trim(),
            recaptchaEnabled: $('#setRecaptchaEnabled').val() === 'true',
            recaptchaSiteKey: $('#setRecaptchaSiteKey').val().trim()
        };

        var btn = $('#settingsSaveBtn');
        var original = btn.html();
        btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saxlanılır...');

        apiFetch('/admin/settings', { method: 'PUT', body: JSON.stringify(payload) })
            .then(function ()
            {
                btn.prop('disabled', false).html(original);
                showAlert('Parametrlər uğurla yadda saxlanıldı.', 'success');
            })
            .catch(function (err)
            {
                btn.prop('disabled', false).html(original);
                var m = (err && err.data && err.data.error && err.data.error.message) || 'Parametrlər saxlanıla bilmədi.';
                showAlert(m, 'danger');
            });
    });

    loadSettings();
});
