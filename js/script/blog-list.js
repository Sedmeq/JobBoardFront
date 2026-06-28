/**
 * Blog listing integration.
 * Dokumentasiya:
 *   GET /api/blog/posts?keyword=&category=&page=&pageSize=
 */
$(document).ready(function ()
{
    var container = $('#blogPostsContainer');
    if (!container.length) return;

    var pagination = $('#blogPagination');
    var currentPage = 1;
    var pageSize = 6;

    function escapeHtml(t) { return $('<div>').text(t == null ? '' : t).html(); }

    function formatDate(d)
    {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function fetchPosts(page)
    {
        currentPage = page || 1;
        container.html('<div class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading articles...</p></div>');
        if (pagination.length) pagination.empty();

        apiFetch('/blog/posts?page=' + currentPage + '&pageSize=' + pageSize)
            .then(function (result)
            {
                container.empty();
                if (!result.success || !result.data || !result.data.items || !result.data.items.length)
                {
                    container.html('<div class="text-center p-a30"><h4>No articles found</h4></div>');
                    return;
                }
                result.data.items.forEach(function (post)
                {
                    var img = post.featuredImageUrl || 'images/blog/default/thum1.jpg';
                    var author = (post.author && post.author.fullName) || 'Admin';
                    var link = 'blog-details.html?slug=' + encodeURIComponent(post.slug);
                    container.append(
                        '<div class="blog-post blog-lg blog-style-1">' +
                        '<div class="dez-post-media dez-img-effect zoom-slow radius-sm"> <a href="' + link + '"><img src="' + img + '" alt="" onerror="this.src=\'images/blog/default/thum1.jpg\'"></a> </div>' +
                        '<div class="dez-info">' +
                        '<div class="dez-post-meta"><ul class="d-flex align-items-center">' +
                        '<li class="post-date"><i class="fa fa-calendar"></i>' + formatDate(post.publishedAt || post.createdAt) + '</li>' +
                        '<li class="post-author"><i class="fa fa-user"></i>By <a href="#">' + escapeHtml(author) + '</a></li>' +
                        '<li class="post-comment"><i class="far fa-comments"></i><a href="#">' + (post.viewCount != null ? post.viewCount : 0) + '</a></li>' +
                        '</ul></div>' +
                        '<div class="dez-post-title"><h4 class="post-title font-24"><a href="' + link + '">' + escapeHtml(post.title) + '</a></h4></div>' +
                        '<div class="dez-post-text"><p>' + escapeHtml(post.summary || '') + '</p></div>' +
                        '<div class="dez-post-readmore blog-share"><a href="' + link + '" title="READ MORE" rel="bookmark" class="site-button-link"><span class="fw6">READ MORE</span></a></div>' +
                        '</div>' +
                        '</div>'
                    );
                });
                renderPagination(result.data.pageCount, result.data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Blog fetch error:', err);
                container.html('<div class="text-center p-a30"><p class="text-danger">Failed to load articles. Please try again.</p></div>');
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        if (!pagination.length) return;
        pagination.empty();
        if (pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
        {
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        }
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount)
            {
                fetchPosts(p);
                $('html, body').animate({ scrollTop: 0 }, 300);
            }
        });
    }

    fetchPosts(1);
});
