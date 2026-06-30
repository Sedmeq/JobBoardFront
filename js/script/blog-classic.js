/**
 * Blog Classic Sidebar — tam funksional (siyahı + axtarış + kateqoriya + tag + son məqalələr).
 * Backend:
 *   GET /api/blog/posts?keyword=&category=&tag=&page=&pageSize=
 *   GET /api/blog/categories
 *   GET /api/blog/tags
 */
$(document).ready(function ()
{
    var container = $('#blogPostsContainer');
    if (!container.length) return;

    var pagination = $('#blogPagination');
    var currentPage = 1;
    var pageSize = 5;
    var filter = { keyword: '', category: '', tag: '' };

    function esc(t) { return $('<div>').text(t == null ? '' : t).html(); }
    function fmtDate(d)
    {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function updateActiveFilter()
    {
        var txt = '';
        if (filter.category) txt = 'Category: ' + filter.category;
        else if (filter.tag) txt = 'Tag: ' + filter.tag;
        else if (filter.keyword) txt = 'Search: ' + filter.keyword;
        if (txt) { $('#blogActiveFilterText').text(txt); $('#blogActiveFilter').show(); }
        else $('#blogActiveFilter').hide();
    }

    function fetchPosts(page)
    {
        currentPage = page || 1;
        container.html('<div class="text-center p-a30"><i class="fa fa-spinner fa-spin fa-2x text-primary"></i><p class="m-t10">Loading articles...</p></div>');
        pagination.empty();

        var q = ['page=' + currentPage, 'pageSize=' + pageSize];
        if (filter.keyword) q.push('keyword=' + encodeURIComponent(filter.keyword));
        if (filter.category) q.push('category=' + encodeURIComponent(filter.category));
        if (filter.tag) q.push('tag=' + encodeURIComponent(filter.tag));

        apiFetch('/blog/posts?' + q.join('&'))
            .then(function (result)
            {
                container.empty();
                var data = (result && result.data) || {};
                if (!data.items || !data.items.length)
                {
                    container.html('<div class="text-center p-a30"><h4>No articles found</h4><p class="text-muted">Try a different search or category.</p></div>');
                    return;
                }
                data.items.forEach(function (post)
                {
                    var img = post.featuredImageUrl || 'images/blog/default/thum1.jpg';
                    var author = (post.author && post.author.fullName) || 'Admin';
                    var link = 'blog-details.html?slug=' + encodeURIComponent(post.slug);
                    container.append(
                        '<div class="blog-post blog-md clearfix m-b40">' +
                        '<div class="dez-post-media dez-img-effect zoom-slow radius-sm m-b20"><a href="' + link + '">' +
                        '<img src="' + esc(img) + '" alt="" onerror="this.src=\'images/blog/default/thum1.jpg\'"></a></div>' +
                        '<div class="dez-info">' +
                        '<div class="dez-post-meta"><ul class="d-flex align-items-center" style="gap:16px;flex-wrap:wrap;">' +
                        '<li class="post-date"><i class="fa fa-calendar"></i> ' + fmtDate(post.publishedAt || post.createdAt) + '</li>' +
                        '<li class="post-author"><i class="fa fa-user"></i> ' + esc(author) + '</li>' +
                        (post.category ? '<li><i class="fa fa-folder"></i> ' + esc(post.category) + '</li>' : '') +
                        '<li><i class="far fa-comments"></i> ' + (post.commentCount || 0) + '</li>' +
                        '</ul></div>' +
                        '<div class="dez-post-title"><h4 class="post-title"><a href="' + link + '">' + esc(post.title) + '</a></h4></div>' +
                        '<div class="dez-post-text"><p>' + esc(post.excerpt || '') + '</p></div>' +
                        '<div class="dez-post-readmore"><a href="' + link + '" class="site-button-link"><span class="fw6">READ MORE</span></a></div>' +
                        '</div>' +
                        '</div>'
                    );
                });
                renderPagination(data.pageCount, data.hasNextPage);
            })
            .catch(function (err)
            {
                console.error('Blog fetch error:', err);
                container.html('<div class="text-center p-a30"><p class="text-danger">Failed to load articles.</p></div>');
            });
    }

    function renderPagination(pageCount, hasNextPage)
    {
        pagination.empty();
        if (!pageCount || pageCount <= 1) return;
        pagination.append('<li class="previous ' + (currentPage === 1 ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage - 1) + '"><i class="ti-arrow-left"></i> Prev</a></li>');
        for (var i = 1; i <= pageCount; i++)
            pagination.append('<li class="' + (i === currentPage ? 'active' : '') + '"><a href="javascript:void(0);" data-page="' + i + '">' + i + '</a></li>');
        pagination.append('<li class="next ' + (!hasNextPage ? 'disabled' : '') + '"><a href="javascript:void(0);" data-page="' + (currentPage + 1) + '">Next <i class="ti-arrow-right"></i></a></li>');
        pagination.find('a').off('click').on('click', function (e)
        {
            e.preventDefault();
            var p = parseInt($(this).attr('data-page'));
            if (p && p !== currentPage && p >= 1 && p <= pageCount) { fetchPosts(p); $('html,body').animate({ scrollTop: 0 }, 300); }
        });
    }

    // Sidebar: recent posts
    apiFetch('/blog/posts?page=1&pageSize=5')
        .then(function (result)
        {
            var box = $('#blogRecentPosts');
            var items = (result && result.data && result.data.items) || [];
            box.empty();
            if (!items.length) { box.html('<p class="text-muted font-13">No posts yet.</p>'); return; }
            items.forEach(function (post)
            {
                var img = post.featuredImageUrl || 'images/blog/default/thum1.jpg';
                var link = 'blog-details.html?slug=' + encodeURIComponent(post.slug);
                box.append(
                    '<div class="widget-post clearfix">' +
                    '<div class="dez-post-media"> <img src="' + esc(img) + '" width="200" height="143" alt="" onerror="this.src=\'images/blog/default/thum1.jpg\'"> </div>' +
                    '<div class="dez-post-info">' +
                    '<div class="dez-post-header"><h6 class="post-title"><a href="' + link + '">' + esc(post.title) + '</a></h6></div>' +
                    '<div class="dez-post-meta"><ul><li class="post-date"> ' + fmtDate(post.publishedAt || post.createdAt) + '</li></ul></div>' +
                    '</div></div>'
                );
            });
        })
        .catch(function () { });

    // Sidebar: categories
    apiFetch('/blog/categories')
        .then(function (result)
        {
            var ul = $('#blogCategoriesList');
            var items = (result && result.data) || [];
            ul.empty();
            if (!items.length) { ul.html('<li class="text-muted font-13">No categories.</li>'); return; }
            items.forEach(function (c)
            {
                ul.append('<li><a href="javascript:void(0);" class="blog-cat" data-cat="' + esc(c.category) + '">' +
                    esc(c.category) + '</a> <span>(' + (c.postCount || 0) + ')</span></li>');
            });
            ul.find('.blog-cat').on('click', function ()
            {
                filter = { keyword: '', category: $(this).attr('data-cat'), tag: '' };
                $('#blogSearchInput').val('');
                updateActiveFilter();
                fetchPosts(1);
            });
        })
        .catch(function () { });

    // Sidebar: tags
    apiFetch('/blog/tags')
        .then(function (result)
        {
            var box = $('#blogTagsList');
            var items = (result && result.data) || [];
            box.empty();
            if (!items.length) { box.html('<span class="text-muted font-13">No tags.</span>'); return; }
            items.forEach(function (t)
            {
                box.append('<a href="javascript:void(0);" class="blog-tag" data-tag="' + esc(t.tag) + '">' + esc(t.tag) + '</a> ');
            });
            box.find('.blog-tag').on('click', function ()
            {
                filter = { keyword: '', category: '', tag: $(this).attr('data-tag') };
                $('#blogSearchInput').val('');
                updateActiveFilter();
                fetchPosts(1);
            });
        })
        .catch(function () { });

    // Search
    $('#blogSearchForm').on('submit', function (e)
    {
        e.preventDefault();
        filter = { keyword: $('#blogSearchInput').val().trim(), category: '', tag: '' };
        updateActiveFilter();
        fetchPosts(1);
    });

    $('#blogClearFilter').on('click', function ()
    {
        filter = { keyword: '', category: '', tag: '' };
        $('#blogSearchInput').val('');
        updateActiveFilter();
        fetchPosts(1);
    });

    // URL parametrlərindən başlanğıc filtr (detal səhifəsindən gələn linklər üçün)
    (function ()
    {
        var p = new URLSearchParams(window.location.search);
        filter.keyword = p.get('keyword') || '';
        filter.category = p.get('category') || '';
        filter.tag = p.get('tag') || '';
        if (filter.keyword) $('#blogSearchInput').val(filter.keyword);
        updateActiveFilter();
    })();

    fetchPosts(1);
});
