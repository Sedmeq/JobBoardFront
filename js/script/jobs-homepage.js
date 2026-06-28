$(document).ready(function () {
    var jobsContainer = $('#latestJobsContainer');

    // ─── Yardımçı funksiyalar ─────────────────────────────

    /** Nisbi vaxt hesablama */
    function timeAgo(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        var now = new Date();
        var seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 0) return 'Just now'; // Gələcək vaxt olarsa
        if (seconds < 60) return 'Just now';
        
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + ' minutes ago';
        
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + ' hours ago';
        
        var days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return days + ' days ago';
    }

    /** Maaş formatı */
    function formatSalary(job) {
        if (!job.isSalaryVisible || (!job.salaryMin && !job.salaryMax)) {
            return 'Salary Negotiable';
        }
        var currency = job.salaryCurrency || 'AZN';
        if (job.salaryMin && job.salaryMax) {
            return job.salaryMin + ' - ' + job.salaryMax + ' ' + currency;
        }
        return (job.salaryMin || job.salaryMax) + ' ' + currency;
    }

    /** Təsviri qısaltmaq */
    function getShortDescription(desc) {
        if (!desc) return 'No description provided. Click details to read more.';
        // HTML tag-lərini təmizləmək
        var cleanDesc = desc.replace(/<\/?[^>]+(>|$)/g, "");
        if (cleanDesc.length > 90) {
            return cleanDesc.substring(0, 90) + '...';
        }
        return cleanDesc;
    }

    // ─── Son elanları yüklə ────────────────────────────────
    function loadLatestJobs() {
        jobsContainer.html('<div class="col-12 text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading jobs...</p></div>');

        apiFetch('/jobs?sortBy=newest&pageSize=6')
            .then(function (result) {
                jobsContainer.empty();

                if (!result.success || !result.data || !result.data.items || result.data.items.length === 0) {
                    jobsContainer.html('<div class="col-12 text-center p-a30"><p class="text-muted">No active job listings found.</p></div>');
                    return;
                }

                var jobs = result.data.items;
                jobs.forEach(function (job) {
                    // Şirkət loqosunun URL-i yoxdursa standart loqo verək
                    var logoUrl = (job.company && job.company.logoUrl) || 'images/icons/google.png';
                    var companyName = (job.company && job.company.name) || 'Anonymous Company';
                    
                    var jobHtml = `
                        <div class="col-xl-4 col-md-6">
                            <div class="job-wrapper m-b20">
                                <div class="jobs-profile d-flex align-items-center">
                                    <div class="dz-icon">
                                        <img src="${logoUrl}" alt="${companyName}" onerror="this.src='images/icons/google.png'">
                                    </div>
                                    <div class="Profile-inner">
                                        <h5 class="profile-name">${companyName} , ${job.location || 'Remote'}</h5>
                                        <span class="profile-positions">
                                            <a href="job-detail.html?id=${job.id}">${job.title}</a>
                                        </span>
                                    </div>
                                </div>
                                <div class="Profile-inner-2">
                                    <p>${getShortDescription(job.description)}</p>
                                    <div class="dz-buttons d-flex align-items-center">
                                        <a href="job-detail.html?id=${job.id}" class="site-button style-1">Apply Now</a>
                                        <div class="dz-salary"><span>${formatSalary(job)}</span></div>
                                    </div>
                                </div>
                                <div class="dz-timing">
                                    <span>${timeAgo(job.createdAt)}</span>
                                    <a href="javascript:void(0);">${job.jobType || 'Full-time'}</a>
                                </div>
                            </div>
                        </div>
                    `;
                    jobsContainer.append(jobHtml);
                });
            })
            .catch(function (err) {
                console.error("Latest jobs loading error:", err);
                jobsContainer.html('<div class="col-12 text-center p-a30"><p class="text-danger">Failed to load jobs. Please try again later.</p></div>');
            });
    }

    // ─── Axtarış düyməsini idarə et ───────────────────────
    $('#homepageSearchForm').on('submit', function (e) {
        e.preventDefault();
        var keyword = $('#searchKeyword').val().trim();
        var location = $('#searchLocation').val().trim();

        var searchUrl = 'browse-job-filter-grid.html';
        var params = [];
        if (keyword) params.push('keyword=' + encodeURIComponent(keyword));
        if (location) params.push('location=' + encodeURIComponent(location));

        if (params.length > 0) {
            searchUrl += '?' + params.join('&');
        }
        window.location.href = searchUrl;
    });

    // Başlanğıcda işləri yüklə
    loadLatestJobs();
});
