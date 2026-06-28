/**
 * Change Password integration (Candidate / Employer).
 * Dokumentasiya:
 *   POST /api/auth/change-password
 *   { currentPassword, newPassword, confirmPassword }
 */
$(document).ready(function ()
{
    var form = $('#changePasswordForm');
    if (!form.length) return;

    // Giriş tələb olunur
    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var alertEl = $('#changePassAlert');

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type === 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        alertEl.slideUp(0);

        var current = $('#oldPassword').val();
        var newPass = $('#newPassword').val();
        var confirm = $('#confirmNewPassword').val();

        if (!current || !newPass || !confirm)
        {
            showAlert('Bütün xanaları doldurun.', 'danger');
            return;
        }
        if (newPass.length < 6)
        {
            showAlert('Yeni şifrə ən azı 6 simvol olmalıdır.', 'danger');
            return;
        }
        if (newPass !== confirm)
        {
            showAlert('Yeni şifrələr uyğun gəlmir.', 'danger');
            return;
        }

        var btn = $('#changePassBtn');
        var original = btn.html();
        btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Yenilənir...');

        apiFetch('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                currentPassword: current,
                newPassword: newPass,
                confirmPassword: confirm
            })
        })
            .then(function ()
            {
                btn.prop('disabled', false).html(original);
                form[0].reset();
                showAlert('Şifrə uğurla dəyişdirildi.', 'success');
            })
            .catch(function (err)
            {
                btn.prop('disabled', false).html(original);
                var msg = (err && err.data && err.data.error && err.data.error.message)
                    || 'Şifrə dəyişdirilə bilmədi. Cari şifrənizi yoxlayın.';
                showAlert(msg, 'danger');
            });
    });
});
