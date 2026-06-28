$(document).ready(function () {
    var gridContainer = $('#jobsGridContainer');
    var paginationContainer = $('#jobsPagination');
    var foundLabel = $('#jobsFoundLabel');

    var currentPage = 1;
    var pageSize = 6;

    // ─── URL Parametrlərini Oxu ────────────────────────────
    var params = new URLSearchParams(window.location.search);
    var initKeyword = params.get('keyword') || '';
    var initLocation = params.get('location') || '';
    var initCategory = params.get('category') || '';

    // Form elementlərini doldur
    $('#gridSearchKeyword').val(initKeyword);
    $('#gridSearchLocation').val(initLocation);
    if (initCategory) {
        $('#gridSearchCategory').val(initCategory);
    }

    // ─── Yardımçı funksiyalar ─────────────────────────────
    function timeAgo(dateString) {
        if (!dateString) return '';
        var date = new Date(dateString);
        var now = new Date();
        var seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 0) return 'Just now';
        if (seconds < 60) return 'Just now';
        
        var minutes = Math.floor(seconds / 60);
        if (minutes < 60) return minutes + 'm ago';
        
        var hours = Math.floor(minutes / 60);
        if (hours < 24) return hours + 'h ago';
        
        var days = Math.floor(hours / 24);
        if (days === 1) return 'Yesterday';
        return days + 'd ago';
    }

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

    // ─── API-dən İşləri Yüklə ──────────────────────────────
    function fetchJobs(page) {
        currentPage = page || 1;
        
        var keyword = $('#gridSearchKeyword').val().trim();
        var location = $('#gridSearchLocation').val().trim();
        var categoryId = $('#gridSearchCategory').val();
        var sortBy = $('#gridSortBy').val() || 'newest';

        // Spinner göstər
        gridContainer.html('<div class="col-12 text-center p-a50"><i class="fa fa-spinner fa-spin fa-3x text-primary"></i><p class="m-t15">Searching for matching jobs...</p></div>');
        paginationContainer.empty();
        foundLabel.text('Loading Jobs...');

        // Query parametrlərini qur
        var queryParams = [];
        queryParams.push('page=' + currentPage);
        queryParams.push('pageSize=' + pageSize);
        queryParams.push('sortBy=' + sortBy);
        
        if (keyword) queryParams.push('keyword=' + encodeURIComponent(keyword));
        if (location) queryParams.push('location=' + encodeURIComponent(location));
        if (categoryId) queryParams.push('categoryId=' + categoryId);

        var url = '/jobs?' + queryParams.join('&');

        apiFetch(url)
            .then(function (result) {
                gridContainer.empty();

                if (!result.success || !result.data || !result.data.items || result.data.items.length === 0) {
                    foundLabel.text('0 Jobs Found');
                    gridContainer.html(`
                        <div class="col-12 text-center p-a50 bg-gray m-b20 border-round">
                            <i class="fa fa-search fa-3x text-muted m-b15"></i>
                            <h4>No matching jobs found</h4>
                            <p class="text-muted">Try adjusting your keywords, location or category filters.</p>
                        </div>
                    `);
                    return;
                }

                var data = result.data;
                foundLabel.text(data.totalCount + ' Jobs Found');

                data.items.forEach(function (job) {
                    var companyName = (job.company && job.company.name) || 'Anonymous Company';
                    var jobTypeLabel = job.jobType || 'Full Time';
                    
                    var jobHtml = `
                        <li class="col-lg-6 col-md-12">
                            <div class="post-bx">
                                <div class="d-flex m-b30">
                                    <div class="job-post-info">
                                        <h5><a href="job-detail.html?id=${job.id}">${job.title}</a></h5>
                                        <ul>
                                            <li><i class="fas fa-map-marker-alt"></i> ${job.location || 'Remote'}</li>
                                            <li><i class="far fa-bookmark"></i> ${jobTypeLabel}</li>
                                            <li><i class="far fa-clock"></i> Published ${timeAgo(job.createdAt)}</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="d-flex">
                                    <div class="job-time me-auto">
                                        <a href="javascript:void(0);"><span>${jobTypeLabel}</span></a>
                                    </div>
                                    <div class="salary-bx">
                                        <span>${formatSalary(job)}</span>
                                    </div>
                                </div>
                                <label class="like-btn">
                                    <input type="checkbox" ${job.isSaved ? 'checked' : ''} data-save-job-id="${job.id}">
                                    <span class="checkmark"></span>
                                </label>
                            </div>
                        </li>
                    `;
                    gridContainer.append(jobHtml);
                });

                // Liked / Saved iş kliklərini bağla
                setupSaveJobHandler();

                // Pagination render et
                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err) {
                console.error("Jobs fetch error:", err);
                foundLabel.text('Search Failed');
                gridContainer.html('<div class="col-12 text-center p-a50"><p class="text-danger">Failed to connect to the search server. Please try again.</p></div>');
            });
    }

    // ─── Liked/Saved İş İdarəçisi ─────────────────────────
    function setupSaveJobHandler() {
        $('.like-btn input').off('change').on('change', function () {
            var jobId = $(this).attr('data-save-job-id');
            var isSaved = $(this).is(':checked');

            // API endpoint yoxdursa belə visual feedback veririk
            var endpoint = isSaved ? `/jobs/${jobId}/save` : `/jobs/${jobId}/unsave`;
            
            // Authorization token varsa göndərək
            var accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                // Giriş edilməyibsə login-ə yönləndir
                window.location.href = 'login-3.html';
                return;
            }

            apiFetch(endpoint, { method: 'POST' })
                .then(function (res) {
                    console.log("Job save status changed:", res);
                })
                .catch(function (err) {
                    console.error("Failed to save/unsave job:", err);
                });
        });
    }

    // ─── Pagination Render ────────────────────────────────
    function renderPagination(pageCount, hasNextPage) {
        paginationContainer.empty();
        if (pageCount <= 1) return;

        // Previous düyməsi
        var prevDisabledClass = currentPage === 1 ? 'disabled' : '';
        var prevHtml = `<li class="previous ${prevDisabledClass}"><a href="javascript:void(0);" data-page="${currentPage - 1}"><i class="ti-arrow-left"></i> Prev</a></li>`;
        paginationContainer.append(prevHtml);

        // Səhifə nömrələri
        for (var i = 1; i <= pageCount; i++) {
            var activeClass = i === currentPage ? 'active' : '';
            var pageHtml = `<li class="${activeClass}"><a href="javascript:void(0);" data-page="${i}">${i}</a></li>`;
            paginationContainer.append(pageHtml);
        }

        // Next düyməsi
        var nextDisabledClass = !hasNextPage ? 'disabled' : '';
        var nextHtml = `<li class="next ${nextDisabledClass}"><a href="javascript:void(0);" data-page="${currentPage + 1}">Next <i class="ti-arrow-right"></i></a></li>`;
        paginationContainer.append(nextHtml);

        // Klik hadisələri
        paginationContainer.find('a').off('click').on('click', function (e) {
            e.preventDefault();
            var targetPage = parseInt($(this).attr('data-page'));
            if (targetPage && targetPage !== currentPage && targetPage >= 1 && targetPage <= pageCount) {
                fetchJobs(targetPage);
                // Səhifənin yuxarısına fırlat
                $('html, body').animate({ scrollTop: $('#gridSearchForm').offset().top - 100 }, 300);
            }
        });
    }

    // ─── Event Listeners ─────────────────────────────────

    // Form submit edildikdə axtar
    $('#gridSearchForm').on('submit', function (e) {
        e.preventDefault();
        fetchJobs(1);
    });

    // Sıralama (Sort) dəyişdikdə
    $('#gridSortBy').on('change', function () {
        fetchJobs(1);
    });

    // İlk yüklənmə
    fetchJobs(1);
});
