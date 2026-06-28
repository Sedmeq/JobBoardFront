/**
 * Company Profile integration (Employer).
 * Dokumentasiya:
 *   GET /api/companies/me
 *   PUT /api/companies/me  (multipart/form-data: name, description, industry, companySize,
 *                           website, location, phone, email, foundedYear,
 *                           socialFacebook, socialTwitter, socialLinkedIn, logo, coverImage)
 */
$(document).ready(function ()
{
    var form = $('#companyProfileForm');
    if (!form.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var alertEl = $('#companyAlert');

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    // Sol-yuxarı profil kartındakı logonu yeniləyən köməkçi (cache-bust ilə)
    function setSidebarLogo(url)
    {
        if (!url) return;
        var bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
        $('.company-info .canditate-des > a img').first()
            .attr('src', bust).attr('onerror', "this.src='images/logo/icon3.jpg'");
    }

    function loadCompany()
    {
        apiFetch('/companies/me')
            .then(function (result)
            {
                $('#companyLoading').hide();
                form.show();
                if (!result.success || !result.data) return;
                var c = result.data;
                $('#compName').val(c.name || '');
                $('#compEmail').val(c.email || '');
                $('#compWebsite').val(c.website || '');
                $('#compFoundedYear').val(c.foundedYear || '');
                $('#compIndustry').val(c.industry || '');
                $('#compSize').val(c.companySize || '');
                $('#compLocation').val(c.location || '');
                $('#compPhone').val(c.phone || '');
                $('#compDescription').val(c.description || '');
                $('#compFacebook').val(c.socialFacebook || '');
                $('#compTwitter').val(c.socialTwitter || '');
                $('#compLinkedIn').val(c.socialLinkedIn || '');

                if (c.name) $('.company-info .candidate-title h4 a').first().text(c.name);
                if (c.logoUrl) setSidebarLogo(c.logoUrl);
            })
            .catch(function (err)
            {
                $('#companyLoading').hide();
                form.show();
                console.error('Company load error:', err);
                showAlert('Could not load company profile. You can still fill and save.', 'warning');
            });
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        $('#companySpinner').show();
        $('#companySaveBtn').prop('disabled', true);

        // multipart/form-data — fayllar olduğu üçün FormData istifadə edirik
        var fd = new FormData();
        fd.append('name', $('#compName').val().trim());
        fd.append('email', $('#compEmail').val().trim());
        fd.append('website', $('#compWebsite').val().trim());
        fd.append('foundedYear', $('#compFoundedYear').val().trim());
        fd.append('industry', $('#compIndustry').val().trim());
        fd.append('companySize', $('#compSize').val());
        fd.append('location', $('#compLocation').val().trim());
        fd.append('phone', $('#compPhone').val().trim());
        fd.append('description', $('#compDescription').val().trim());
        fd.append('socialFacebook', $('#compFacebook').val().trim());
        fd.append('socialTwitter', $('#compTwitter').val().trim());
        fd.append('socialLinkedIn', $('#compLinkedIn').val().trim());

        var logo = $('#compLogo')[0].files[0];
        if (logo) fd.append('logo', logo);
        var cover = $('#compCover')[0].files[0];
        if (cover) fd.append('coverImage', cover);

        // FormData göndərəndə Content-Type avtomatik təyin olunur (api-client onu silmir)
        apiFetch('/companies/me', { method: 'PUT', body: fd })
            .then(function (result)
            {
                $('#companySpinner').hide();
                $('#companySaveBtn').prop('disabled', false);
                showAlert('Company profile updated successfully.', 'success');

                var data = (result && result.data) || {};
                if ($('#compName').val()) $('.company-info .candidate-title h4 a').first().text($('#compName').val());
                // Yeni logonu sol-yuxarı profil kartında göstər
                if (data.logoUrl) setSidebarLogo(data.logoUrl);
                // Fayl input-larını sıfırla ki, təkrar submit-də yenidən göndərilməsin
                $('#compLogo').val('');
                $('#compCover').val('');
            })
            .catch(function (err)
            {
                $('#companySpinner').hide();
                $('#companySaveBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to update company profile. Please try again.';
                showAlert(msg, 'danger');
            });
    });

    // Formdakı "Logo" inputu seçiləndə dərhal sol-yuxarı kartda preview göstər
    $('#compLogo').on('change', function ()
    {
        var file = this.files && this.files[0];
        if (file) $('.company-info .canditate-des > a img').first().attr('src', URL.createObjectURL(file));
    });

    // Sol-yuxarı kartdakı qələm ikonu (.update-flie) ilə logonu birbaşa yüklə
    $('.company-info .update-flie').on('change', function ()
    {
        var file = this.files && this.files[0];
        if (!file) return;
        // dərhal preview
        $('.company-info .canditate-des > a img').first().attr('src', URL.createObjectURL(file));
        var fd = new FormData();
        fd.append('file', file);
        apiFetch('/companies/me/logo', { method: 'POST', body: fd })
            .then(function (result)
            {
                var url = result && result.data && result.data.url;
                if (url) setSidebarLogo(url);
                showAlert('Logo updated successfully.', 'success');
            })
            .catch(function ()
            {
                showAlert('Failed to upload logo. Please try again.', 'danger');
            });
    });

    loadCompany();
});
