$(document).ready(function ()
{
    var jobsContainer = $('#latestJobsContainer');

    // ─── Yardımçı funksiyalar ─────────────────────────────

    /** Nisbi vaxt hesablama */
    function timeAgo(dateString)
    {
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

    /** Təsviri qısaltmaq */
    function getShortDescription(desc)
    {
        if (!desc) return 'No description provided. Click details to read more.';
        // HTML tag-lərini təmizləmək
        var cleanDesc = desc.replace(/<\/?[^>]+(>|$)/g, "");
        if (cleanDesc.length > 90)
        {
            return cleanDesc.substring(0, 90) + '...';
        }
        return cleanDesc;
    }

    // ─── Son elanları yüklə ────────────────────────────────
    var currentPage = 1;
    var pageSize = 6;
    var totalPages = 1;

    function buildJobCard(job)
    {
        var logoUrl = (job.company && job.company.logoUrl) || 'images/icons/google.png';
        var companyName = (job.company && job.company.name) || 'Anonymous Company';
        return `
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
    }

    function loadJobs(page, append)
    {
        var btn = $('#loadMoreJobsBtn');
        if (append)
        {
            btn.data('orig', btn.data('orig') || btn.html());
            btn.html('<i class="fa fa-spinner fa-spin"></i> Loading...').css('pointer-events', 'none');
        } else
        {
            jobsContainer.html('<div class="col-12 text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading jobs...</p></div>');
        }

        apiFetch('/jobs?sortBy=newest&page=' + page + '&pageSize=' + pageSize)
            .then(function (result)
            {
                if (!append) jobsContainer.empty();

                var data = (result && result.data) || {};
                var jobs = data.items || [];

                if (!append && jobs.length === 0)
                {
                    jobsContainer.html('<div class="col-12 text-center p-a30"><p class="text-muted">No active job listings found.</p></div>');
                    $('#loadMoreJobsBtn').hide();
                    return;
                }

                jobs.forEach(function (job) { jobsContainer.append(buildJobCard(job)); });

                currentPage = data.page || page;
                totalPages = data.pageCount || 1;

                // Daha çox iş varsa düyməni göstər, yoxsa gizlət
                if (currentPage >= totalPages || (data.hasNextPage === false))
                {
                    $('#loadMoreJobsBtn').hide();
                } else
                {
                    $('#loadMoreJobsBtn').show().html(btn.data('orig') || 'Load More').css('pointer-events', 'auto');
                }
            })
            .catch(function (err)
            {
                console.error("Latest jobs loading error:", err);
                if (!append)
                {
                    jobsContainer.html('<div class="col-12 text-center p-a30"><p class="text-danger">Failed to load jobs. Please try again later.</p></div>');
                }
                $('#loadMoreJobsBtn').html('Load More').css('pointer-events', 'auto');
            });
    }

    function loadLatestJobs()
    {
        currentPage = 1;
        loadJobs(1, false);
    }

    // Load More düyməsi
    $('#loadMoreJobsBtn').on('click', function (e)
    {
        e.preventDefault();
        if (currentPage < totalPages) loadJobs(currentPage + 1, true);
    });

    // ─── Axtarış düyməsini idarə et ───────────────────────
    $('#homepageSearchForm').on('submit', function (e)
    {
        e.preventDefault();
        var keyword = $('#searchKeyword').val().trim();
        var location = $('#searchLocation').val().trim();

        var searchUrl = 'browse-job-filter-grid.html';
        var params = [];
        if (keyword) params.push('keyword=' + encodeURIComponent(keyword));
        if (location) params.push('location=' + encodeURIComponent(location));

        if (params.length > 0)
        {
            searchUrl += '?' + params.join('&');
        }
        window.location.href = searchUrl;
    });

    // ─── Partnyor loqolarını yüklə ─────────────────────────
    function loadPartners()
    {
        var box = $('#partnersContainer');
        if (!box.length) return;
        apiFetch('/partners')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                box.empty();
                if (!items.length) { box.closest('.partners').hide(); return; }
                items.forEach(function (p)
                {
                    var logo = p.logoUrl;
                    var inner = '<a href="' + (p.website ? p.website : 'javascript:void(0);') + '"' +
                        (p.website ? ' target="_blank" rel="noopener"' : '') + ' class="partners-media">' +
                        '<img src="' + logo + '" alt="' + (p.name || '') + '" onerror="this.style.display=\'none\'">' +
                        '</a>';
                    box.append('<div class="col-lg-2 col-md-3 col-4 text-center m-b20"><div class="item">' + inner + '</div></div>');
                });
            })
            .catch(function (err)
            {
                console.error('Partners load error:', err);
                $('#partnersContainer').closest('.partners').hide();
            });
    }

    // ─── Testimonials (müştəri rəyləri) ────────────────────
    var QUOTE_SVG = '<svg width="48" height="35" viewBox="0 0 64 46" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M50.6293 17.2257C50.5004 15.8322 50.599 12.0441 54.2279 6.77654C54.5024 6.37904 54.4526 5.84295 54.1117 5.50214C52.6322 4.02264 51.7162 3.08904 51.0737 2.43575C50.2289 1.57434 49.8432 1.18184 49.2787 0.670045C48.9018 0.331244 48.3315 0.325345 47.9506 0.657445C41.6254 6.16134 34.6 17.5343 35.6166 31.4679C36.2123 39.6495 42.1801 45.588 49.8061 45.588C57.6322 45.588 63.9994 39.2218 63.9994 31.3956C63.9994 23.8458 58.0737 17.6544 50.6293 17.2257Z" fill="#2E55FA"/>' +
        '<path d="M15.1137 17.2257C14.9838 15.8361 15.0795 12.0509 18.7123 6.77654C18.9858 6.37904 18.9369 5.84294 18.5961 5.50214C17.1195 4.02554 16.2045 3.09294 15.5629 2.43964C14.7153 1.57634 14.3285 1.18274 13.7641 0.670039C13.3871 0.331239 12.8168 0.326339 12.436 0.656439C6.11077 6.16034 -0.915635 17.5314 0.0989652 31.4679C0.696665 39.6485 6.66537 45.588 14.2914 45.588C22.1176 45.588 28.4848 39.2218 28.4848 31.3956C28.4848 23.8449 22.559 17.6525 15.1137 17.2257Z" fill="#2E55FA"/>' +
        '</svg>';

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function loadTestimonials()
    {
        var box = $('#testimonialsContainer');
        if (!box.length) return;
        apiFetch('/testimonials')
            .then(function (result)
            {
                var items = (result && result.data) || [];
                if (!items.length) { box.closest('.testimonials').hide(); return; }

                // owl carousel-i söndür, sadə responsive grid kimi göstər (etibarlı)
                box.attr('class', 'row sp20 justify-content-center');
                box.empty();

                items.forEach(function (t)
                {
                    var avatar = t.avatarUrl || 'images/testimonials/pic3.jpg';
                    box.append(
                        '<div class="col-lg-4 col-md-6 m-b30">' +
                        '<div class="testimonial-wrapper">' +
                        '<div class="testimonial-inner">' +
                        '<div class="bg-img">' + QUOTE_SVG + '</div>' +
                        '<div class="testimonial-pic style-1">' +
                        '<div class="testimonial-pic-circle"></div>' +
                        '<div class="profile-pic"><img src="' + esc(avatar) + '" alt="" onerror="this.src=\'images/testimonials/pic3.jpg\'"></div>' +
                        '</div>' +
                        '<div class="profile-info">' +
                        '<h5 class="profile-name">' + esc(t.name) + '</h5>' +
                        (t.subtitle ? '<span>' + esc(t.subtitle) + '</span>' : '') +
                        '</div>' +
                        '<p class="dz-text-3">' + esc(t.message) + '</p>' +
                        '</div>' +
                        '</div>' +
                        '</div>'
                    );
                });
            })
            .catch(function (err)
            {
                console.error('Testimonials load error:', err);
                $('#testimonialsContainer').closest('.testimonials').hide();
            });
    }

    // Başlanğıcda işləri yüklə
    loadLatestJobs();
    loadPartners();
    loadTestimonials();
});
