$(document).ready(function ()
{
    var params = new URLSearchParams(window.location.search);
    var jobId = params.get('id');

    // Job ID yoxdursa, ana səhifəyə qaytar
    if (!jobId)
    {
        window.location.href = 'index.html';
        return;
    }

    // ─── Yardımçı funksiyalar ─────────────────────────────
    function formatSalary(job)
    {
        if (!job.isSalaryVisible || (!job.salaryMin && !job.salaryMax))
        {
            return 'Salary Negotiable';
        }
        var currency = job.salaryCurrency || 'AZN';
        if (job.salaryMin && job.salaryMax)
        {
            return job.salaryMin + ' - ' + job.salaryMax + ' ' + currency;
        }
        return (job.salaryMin || job.salaryMax) + ' ' + currency;
    }

    function formatDate(dateString)
    {
        if (!dateString) return 'Not Specified';
        var date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ─── İş Detallarını Getir ─────────────────────────────
    function loadJobDetails()
    {
        apiFetch('/jobs/' + jobId)
            .then(function (result)
            {
                if (!result.success || !result.data)
                {
                    alert('Job not found.');
                    window.location.href = 'index.html';
                    return;
                }

                var job = result.data;

                // Məlumatları doldur
                $('#detailJobTitle').text(job.title);
                $('#detailJobLocation').text(job.location || 'Remote');
                $('#detailJobLocationSmall').text(job.location || 'Remote');
                $('#detailJobSalary').text(formatSalary(job));
                $('#detailJobExperience').text((job.experienceLevel || 'Not Specified') + ' Level');
                $('#detailJobCategory').text((job.category && job.category.name) || 'General');
                $('#detailJobDeadline').text(formatDate(job.deadline));

                // Loqonu doldur
                if (job.company && job.company.logoUrl)
                {
                    $('#detailCompanyLogo').attr('src', job.company.logoUrl);
                }

                // Təsvirləri doldur (Yeni sətirləri HTML-ə çevirməklə)
                $('#detailJobDescription').html(job.description ? job.description.replace(/\n/g, '<br>') : 'No description provided.');
                $('#detailJobResponsibilities').html(job.responsibilities ? job.responsibilities.replace(/\n/g, '<br>') : 'No responsibilities specified.');
                $('#detailJobRequirements').html(job.requirements ? job.requirements.replace(/\n/g, '<br>') : 'No requirements specified.');
                $('#detailJobBenefits').html(job.benefits ? job.benefits.replace(/\n/g, '<br>') : 'No benefits specified.');

                // Düymələrin vəziyyətini tənzimlə
                var accessToken = localStorage.getItem('accessToken');
                if (!accessToken)
                {
                    $('#loginToApplyBtn').show();
                    $('#applyJobBtn').hide();
                    $('#alreadyAppliedBadge').hide();
                } else
                {
                    if (job.hasApplied)
                    {
                        $('#alreadyAppliedBadge').show();
                        $('#applyJobBtn').hide();
                        $('#loginToApplyBtn').hide();
                    } else
                    {
                        $('#alreadyAppliedBadge').hide();
                        $('#loginToApplyBtn').hide();
                        enforceProfileComplete();
                    }
                }
            })
            .catch(function (err)
            {
                console.error("Job details loading error:", err);
                alert('Could not load job details. Redirecting to home page...');
                window.location.href = 'index.html';
            });
    }

    // Namizədin profili tam deyilsə müraciət düyməsini gizlət, tamamlama bildirişi göstər
    function enforceProfileComplete()
    {
        var role = 'candidate';
        try { role = (JSON.parse(localStorage.getItem('user') || '{}').role || 'candidate').toLowerCase(); } catch (e) { }

        // Yalnız namizədlər üçün profil yoxlaması; digər rollar üçün adi davranış
        if (role !== 'candidate')
        {
            $('#applyJobBtn').show();
            $('#profileIncompleteNotice').remove();
            return;
        }

        apiFetch('/candidates/me')
            .then(function (res)
            {
                var p = (res && res.data) || {};
                var missing = [];
                if (!p.headline) missing.push('Headline');
                if (!p.summary) missing.push('Summary');
                if (!p.location) missing.push('Location');
                if (!p.skills || !p.skills.length) missing.push('Skills');

                $('#profileIncompleteNotice').remove();
                if (missing.length)
                {
                    $('#applyJobBtn').hide();
                    $('#applyJobBtn').after(
                        '<div id="profileIncompleteNotice" class="alert alert-warning m-t10">' +
                        '<i class="fa fa-exclamation-triangle"></i> Müraciət etmək üçün əvvəlcə profilinizi tamamlayın. ' +
                        'Çatışmayan: <strong>' + missing.join(', ') + '</strong>.<br>' +
                        '<a href="jobs-profile.html" class="site-button button-sm m-t10"><i class="fa fa-user"></i> Complete Profile</a> ' +
                        '<a href="jobs-my-resume.html" class="site-button button-sm m-t10">My Resume</a>' +
                        '</div>'
                    );
                } else
                {
                    $('#applyJobBtn').show();
                }
            })
            .catch(function ()
            {
                // Profil yoxlaması alınmasa, düyməni göstər; backend yenə də qoruyur
                $('#applyJobBtn').show();
            });
    }

    // ─── Müraciət Formunu Submit Et ────────────────────────
    $('#applyJobForm').on('submit', function (e)
    {
        e.preventDefault();
        $('#applyAlert').hide();
        $('#err-coverLetter').hide();

        var coverLetter = $('#applyCoverLetter').val().trim();
        if (!coverLetter)
        {
            $('#err-coverLetter').text('Cover letter is required.').show();
            return;
        }

        // Spinner göstər
        $('#applySubmitBtn').prop('disabled', true);
        $('#applySpinner').show();

        apiFetch('/applications', {
            method: 'POST',
            body: JSON.stringify({
                jobId: parseInt(jobId),
                coverLetter: coverLetter
            })
        })
            .then(function (result)
            {
                $('#applySubmitBtn').prop('disabled', false);
                $('#applySpinner').hide();

                if (result.success)
                {
                    // Modalı bağla
                    var modalEl = document.getElementById('applyJobModal');
                    var modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal)
                    {
                        modal.hide();
                    }

                    // Düyməni dəyiş
                    $('#applyJobBtn').hide();
                    $('#alreadyAppliedBadge').fadeIn(300);

                    alert('Your application has been successfully submitted!');
                } else
                {
                    $('#applyAlert').text(result.message || 'Failed to submit application. Please try again.').show();
                }
            })
            .catch(function (err)
            {
                $('#applySubmitBtn').prop('disabled', false);
                $('#applySpinner').hide();

                var msg = 'An error occurred during submission.';
                if (err && err.data && err.data.error)
                {
                    msg = err.data.error.message || msg;
                }
                $('#applyAlert').text(msg).show();
            });
    });

    // Məlumatları yüklə
    loadJobDetails();
});
