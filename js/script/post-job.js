/**
 * Post A Job integration (Employer/Admin).
 * Dokumentasiya:
 *   POST /api/jobs
 *   PUT  /api/jobs/{id}   (?id= URL parametri varsa redaktə rejimi)
 */
$(document).ready(function ()
{
    var form = $('#postJobForm');
    if (!form.length) return;

    if (!localStorage.getItem('accessToken'))
    {
        window.location.href = 'login-3.html';
        return;
    }

    var alertEl = $('#postJobAlert');
    var params = new URLSearchParams(window.location.search);
    var editId = params.get('id');

    function showAlert(msg, type)
    {
        alertEl.removeClass('alert-success alert-danger alert-info alert-warning')
            .addClass('alert-' + (type || 'info')).html(msg).slideDown(200);
        if (type !== 'success') setTimeout(function () { alertEl.slideUp(200); }, 6000);
    }

    // Kateqoriyaları API-dən yüklə və dropdown-u doldur
    function loadCategories(selectedId)
    {
        var select = $('#jobCategoryId');
        return apiFetch('/categories?includeJobCount=false').then(function (result)
        {
            var categories = (result && result.data) || [];
            select.empty();
            // Yalnız seçim olmadıqda (yeni elan) placeholder göstər;
            // redaktə rejimində artıq kateqoriya seçilidir.
            if (!selectedId) select.append('<option value="">Select a category</option>');
            categories.forEach(function (c)
            {
                var opt = $('<option>').val(c.id).text(c.name);
                var icon = c.iconClass || c.icon || '';
                if (icon)
                {
                    // FontAwesome class-dırsa <i>, əks halda emoji kimi göstər
                    var iconHtml = icon.indexOf('fa') === 0
                        ? '<i class="' + icon + '"></i>'
                        : icon;
                    opt.attr('data-content', iconHtml + ' <span>' + $('<div>').text(c.name).html() + '</span>');
                }
                select.append(opt);
            });
            if (selectedId) select.val(String(selectedId));
            // bootstrap-select (custom.js handleBootstrapSelect) bu select-i widget-ə çevirir.
            // Asinxron yükləmədən sonra köhnə widget-i təmizləyib yenidən qururuq ki,
            // "Loading" mətni qalmasın və siyahı alt-alta düşməsin.
            refreshPicker(select);
        }).catch(function (err)
        {
            console.error('Categories load error:', err);
            select.empty().append('<option value="">Failed to load categories</option>');
            refreshPicker(select);
        });
    }

    function refreshPicker(select)
    {
        if (!$.fn.selectpicker) return;
        // custom.js içindəki handleBootstrapSelect window "load" anında bütün select-ləri
        // selectpicker-ə çevirir. Dublikat (alt-alta düşən) widget yaranmaması üçün
        // bizim yeniləməni HƏMİŞƏ ondan sonra işə salırıq və əvvəlcə köhnəni silirik.
        var doRefresh = function ()
        {
            if (select.data('selectpicker')) select.selectpicker('destroy');
            select.selectpicker();
        };
        if (document.readyState === 'complete')
        {
            doRefresh();
        }
        else
        {
            $(window).on('load', doRefresh);
        }
    }

    function blockForm(msg)
    {
        alertEl.removeClass('alert-success alert-danger alert-info')
            .addClass('alert alert-warning').html(msg).show();
        $('#postJobBtn').prop('disabled', true);
    }

    // Yalnız profil tam və admin tərəfindən təsdiqlənmiş şirkət iş elanı yerləşdirə bilər
    function checkCompanyGate()
    {
        var role = 'employer';
        try { role = (JSON.parse(localStorage.getItem('user') || '{}').role || 'employer').toLowerCase(); } catch (e) { }
        if (role !== 'employer') return; // admin üçün məhdudiyyət yoxdur

        apiFetch('/companies/me')
            .then(function (res)
            {
                var c = res && res.data;
                if (!c) return;
                var missing = [];
                if (!c.description) missing.push('Description');
                if (!c.industry) missing.push('Industry');
                if (!c.location) missing.push('Location');
                if (!c.phone) missing.push('Phone');
                if (!c.email) missing.push('Email');

                if (missing.length)
                {
                    blockForm('<i class="fa fa-exclamation-triangle"></i> İş elanı yerləşdirmək üçün əvvəlcə şirkət profilinizi tam doldurun. Çatışmayan: <strong>' +
                        missing.join(', ') + '</strong>. <a href="company-profile.html" class="site-button button-sm m-l10">Profili tamamla</a>');
                }
                else if (!c.isVerified)
                {
                    blockForm('<i class="fa fa-clock"></i> Şirkətiniz hələ admin tərəfindən təsdiqlənməyib. Təsdiqdən sonra iş elanı yerləşdirə biləcəksiniz.');
                }
            })
            .catch(function () { /* sakitcə keç */ });
    }

    if (!editId) loadCategories();
    checkCompanyGate();

    // Redaktə rejimi: mövcud iş məlumatını yüklə
    if (editId)
    {
        $('.job-bx-title h5').first().text('Edit Job');
        $('#postJobBtn').contents().first().replaceWith('Update Job');
        apiFetch('/jobs/' + editId).then(function (result)
        {
            if (result.success && result.data)
            {
                var j = result.data;
                $('#jobTitle').val(j.title || '');
                loadCategories(j.category && j.category.id ? j.category.id : (j.categoryId || ''));
                $('#jobSkills').val((j.requiredSkills || []).map(function (s) { return s.skillName || s; }).join(', '));
                $('#jobType').val(j.jobType || 'Full-time');
                $('#jobExperienceLevel').val(j.experienceLevel || 'Junior');
                $('#jobSalaryMin').val(j.salaryMin || '');
                $('#jobSalaryMax').val(j.salaryMax || '');
                $('#jobSalaryCurrency').val(j.salaryCurrency || 'USD');
                $('#jobLocation').val(j.location || '');
                if (j.deadline) $('#jobDeadline').val(j.deadline.substring(0, 10));
                $('#jobIsRemote').prop('checked', !!j.isRemote);
                $('#jobIsUrgent').prop('checked', !!j.isUrgent);
                $('#jobIsSalaryVisible').prop('checked', j.isSalaryVisible !== false);
                $('#jobDescription').val(j.description || '');
                $('#jobRequirements').val(j.requirements || '');
                $('#jobResponsibilities').val(j.responsibilities || '');
                $('#jobBenefits').val(j.benefits || '');
            }
        }).catch(function (err) { console.error('Job load error:', err); });
    }

    form.on('submit', function (e)
    {
        e.preventDefault();
        alertEl.slideUp(100);

        var title = $('#jobTitle').val().trim();
        var description = $('#jobDescription').val().trim();
        var categoryId = parseInt($('#jobCategoryId').val());

        if (!title || !description || !categoryId)
        {
            showAlert('Please fill in the required fields: Title, Category and Description.', 'danger');
            return;
        }

        var skills = $('#jobSkills').val().split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var deadline = $('#jobDeadline').val();

        var payload = {
            title: title,
            description: description,
            requirements: $('#jobRequirements').val().trim(),
            responsibilities: $('#jobResponsibilities').val().trim(),
            benefits: $('#jobBenefits').val().trim(),
            location: $('#jobLocation').val().trim(),
            isRemote: $('#jobIsRemote').is(':checked'),
            jobType: $('#jobType').val(),
            experienceLevel: $('#jobExperienceLevel').val(),
            categoryId: categoryId,
            salaryMin: parseFloat($('#jobSalaryMin').val()) || null,
            salaryMax: parseFloat($('#jobSalaryMax').val()) || null,
            salaryCurrency: $('#jobSalaryCurrency').val(),
            isSalaryVisible: $('#jobIsSalaryVisible').is(':checked'),
            isUrgent: $('#jobIsUrgent').is(':checked'),
            deadline: deadline ? new Date(deadline).toISOString() : null,
            requiredSkills: skills
        };

        $('#postJobSpinner').show();
        $('#postJobBtn').prop('disabled', true);

        var endpoint = editId ? '/jobs/' + editId : '/jobs';
        var method = editId ? 'PUT' : 'POST';

        apiFetch(endpoint, { method: method, body: JSON.stringify(payload) })
            .then(function (result)
            {
                $('#postJobSpinner').hide();
                $('#postJobBtn').prop('disabled', false);
                showAlert(result.message || (editId ? 'Job updated successfully.' : 'Job posted successfully.'), 'success');
                if (!editId)
                {
                    form[0].reset();
                    $('#jobIsSalaryVisible').prop('checked', true);
                }
                setTimeout(function () { window.location.href = 'company-manage-job.html'; }, 1200);
            })
            .catch(function (err)
            {
                $('#postJobSpinner').hide();
                $('#postJobBtn').prop('disabled', false);
                var msg = (err && err.data && err.data.error && err.data.error.message) || 'Failed to save job. Please try again.';
                if (err && err.status === 403) msg = 'You do not have permission to post jobs. Employer account required.';
                showAlert(msg, 'danger');
            });
    });
});
