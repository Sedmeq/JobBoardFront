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
                $('#jobCategoryId').val(j.category && j.category.id ? j.category.id : (j.categoryId || ''));
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
            showAlert('Please fill in the required fields: Title, Category ID and Description.', 'danger');
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
