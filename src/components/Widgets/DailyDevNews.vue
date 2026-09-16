<template>
  <div class="daily-dev-news">
    <!-- Live Breaking News Ticker Strip -->
    <div class="breaking-ticker" v-if="breakingItems.length > 0">
      <div class="ticker-badge">
        <span class="pulse-dot"></span>
        <span class="badge-text">HAPPENING NOW</span>
      </div>
      <div class="ticker-content" @mouseenter="pauseTicker = true" @mouseleave="pauseTicker = false">
        <transition name="fade-slide" mode="out-in">
          <a
            :key="currentTickerIndex"
            :href="currentTickerItem.link"
            target="_blank"
            rel="noopener noreferrer"
            class="ticker-link"
          >
            <span class="ticker-category">[{{ currentTickerItem.categoryLabel }}]</span>
            <span class="ticker-title">{{ currentTickerItem.title }}</span>
            <span class="ticker-time">{{ currentTickerItem.relativeTime }}</span>
            <span class="ticker-arrow">↗</span>
          </a>
        </transition>
      </div>
    </div>

    <!-- Category Pill Navigation -->
    <div class="category-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="category-pill"
        :class="{ active: selectedCategory === tab.id }"
        @click="selectedCategory = tab.id"
      >
        <span class="pill-icon" v-if="tab.icon">{{ tab.icon }}</span>
        <span class="pill-name">{{ tab.name }}</span>
        <span class="pill-count" v-if="tabCount(tab.id)">{{ tabCount(tab.id) }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading && items.length === 0" class="news-loading">
      <div class="skeleton-card" v-for="i in 4" :key="i">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-line full"></div>
        <div class="skeleton-line half"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredItems.length === 0" class="news-empty">
      <p>No headlines available for this vertical right now.</p>
    </div>

    <!-- Elevated Article Cards Grid -->
    <div v-else class="articles-grid">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="article-card"
      >
        <!-- Card Header Meta -->
        <div class="card-meta">
          <span class="meta-badge" :class="`badge-${item.category}`">
            {{ item.categoryLabel }}
          </span>
          <span class="meta-source">{{ item.source }}</span>
          <span class="meta-time">{{ item.relativeTime }}</span>
        </div>

        <!-- Thumbnail Image (if present) -->
        <div class="card-media" v-if="item.thumbnail">
          <img
            :src="item.thumbnail"
            :alt="item.title"
            loading="lazy"
            @error="onImageError($event, item)"
          />
        </div>

        <!-- Article Content -->
        <div class="card-content">
          <a
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="article-title"
          >
            {{ item.title }}
          </a>
          <p class="article-snippet" v-if="item.snippet">
            {{ item.snippet }}
          </p>
        </div>

        <!-- Card Footer Action -->
        <div class="card-footer">
          <a
            :href="item.link"
            target="_blank"
            rel="noopener noreferrer"
            class="read-link"
          >
            Read Story <span class="ext-icon">↗</span>
          </a>
        </div>
      </article>
    </div>
  </div>
</template>

<script>
import WidgetMixin from '@/mixins/WidgetMixin';
import request from '@/utils/request';

const FEEDS = [
  {
    id: 'ai',
    name: 'AI & Agents',
    icon: '🤖',
    label: '#ai-agents',
    source: 'MIT Tech Review',
    url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed',
  },
  {
    id: 'tech',
    name: 'Technology',
    icon: '💻',
    label: '#technology',
    source: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
  },
  {
    id: 'space',
    name: 'Space',
    icon: '🚀',
    label: '#space',
    source: 'NASA',
    url: 'https://www.nasa.gov/news-release/feed/',
  },
  {
    id: 'archaeology',
    name: 'Ancient History',
    icon: '🏛️',
    label: '#archaeology',
    source: 'Archaeology Mag',
    url: 'https://archaeology.org/feed/',
  },
];

export default {
  name: 'DailyDevNews',
  mixins: [WidgetMixin],
  data() {
    return {
      items: [],
      selectedCategory: 'all',
      loading: true,
      currentTickerIndex: 0,
      tickerTimer: null,
      pauseTicker: false,
      tabs: [
        { id: 'all', name: 'All' },
        ...FEEDS.map((f) => ({ id: f.id, name: f.name, icon: f.icon })),
      ],
    };
  },
  computed: {
    filteredItems() {
      if (this.selectedCategory === 'all') {
        return this.items;
      }
      return this.items.filter((item) => item.category === this.selectedCategory);
    },
    breakingItems() {
      return this.items.slice(0, 8);
    },
    currentTickerItem() {
      return this.breakingItems[this.currentTickerIndex] || {
        title: 'Loading breaking intelligence...',
        categoryLabel: '#intel',
        link: '#',
        relativeTime: 'now',
      };
    },
  },
  methods: {
    tabCount(catId) {
      if (catId === 'all') return this.items.length;
      return this.items.filter((i) => i.category === catId).length;
    },
    onImageError(e, item) {
      // Hide broken thumbnails cleanly
      item.thumbnail = null;
    },
    calculateRelativeTime(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr.replace(' ', 'T'));
      const diffMs = Date.now() - date.getTime();
      if (isNaN(diffMs)) return '';
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    },
    extractThumbnail(rawItem) {
      if (rawItem.thumbnail && typeof rawItem.thumbnail === 'string' && rawItem.thumbnail.startsWith('http')) {
        return rawItem.thumbnail;
      }
      if (rawItem.enclosure && rawItem.enclosure.link && typeof rawItem.enclosure.link === 'string') {
        return rawItem.enclosure.link;
      }
      const desc = rawItem.description || rawItem.content || '';
      const match = desc.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
      if (match && match[1] && !match[1].includes('feedburner') && !match[1].includes('pixel')) {
        return match[1];
      }
      return null;
    },
    cleanSnippet(rawDesc) {
      if (!rawDesc) return '';
      // Strip HTML
      let text = rawDesc.replace(/<[^>]+>/g, ' ');
      // Strip common sponsorship / boilerplate text
      text = text.replace(/Presented by [^.]+\./gi, '');
      text = text.replace(/Continue reading [^.]+\./gi, '');
      text = text.replace(/The post .+ appeared first on .+\./gi, '');
      text = text.replace(/\s+/g, ' ').trim();
      if (text.length > 130) {
        return `${text.slice(0, 125)}...`;
      }
      return text;
    },
    async fetchData() {
      this.loading = true;
      const allFetched = [];

      await Promise.all(
        FEEDS.map(async (feed) => {
          const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;
          try {
            const resp = await request.get(proxyUrl);
            if (resp.data && resp.data.items) {
              resp.data.items.slice(0, 6).forEach((raw, idx) => {
                const pubDate = raw.pubDate || new Date().toISOString();
                const epoch = new Date(pubDate.replace(' ', 'T')).getTime() || Date.now();
                allFetched.push({
                  id: `${feed.id}-${idx}-${epoch}`,
                  title: (raw.title || '').trim(),
                  link: raw.link || '#',
                  pubDate,
                  timestamp: epoch,
                  relativeTime: this.calculateRelativeTime(pubDate),
                  category: feed.id,
                  categoryLabel: feed.label,
                  source: feed.source,
                  thumbnail: this.extractThumbnail(raw),
                  snippet: this.cleanSnippet(raw.description || raw.content),
                });
              });
            }
          } catch (err) {
            // Fail gracefully per feed without crashing widget
          }
        }),
      );

      // Sort all items chronologically newest first
      allFetched.sort((a, b) => b.timestamp - a.timestamp);
      this.items = allFetched;
      this.loading = false;
      this.startTicker();
    },
    startTicker() {
      if (this.tickerTimer) clearInterval(this.tickerTimer);
      this.tickerTimer = setInterval(() => {
        if (!this.pauseTicker && this.breakingItems.length > 0) {
          this.currentTickerIndex = (this.currentTickerIndex + 1) % this.breakingItems.length;
        }
      }, 4000);
    },
  },
  beforeUnmount() {
    if (this.tickerTimer) clearInterval(this.tickerTimer);
  },
};
</script>

<style scoped lang="scss">
.daily-dev-news {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Breaking Ticker Strip */
.breaking-ticker {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(225, 29, 72, 0.35);
  border-radius: 12px;
  padding: 8px 14px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(225, 29, 72, 0.12);
}

.ticker-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  background: rgba(225, 29, 72, 0.18);
  border: 1px solid rgba(225, 29, 72, 0.5);
  border-radius: 8px;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #f43f5e;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #f43f5e;
  box-shadow: 0 0 10px #f43f5e;
  animation: pulse-glow 1.6s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.3); }
}

.ticker-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  height: 24px;
  display: flex;
  align-items: center;
}

.ticker-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #e2e8f0;
  text-decoration: none;
  font-size: 0.86rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  transition: color 0.2s ease;

  &:hover {
    color: #38bdf8;
  }
}

.ticker-category {
  color: #f43f5e;
  font-weight: 700;
  font-size: 0.78rem;
}

.ticker-title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.ticker-time {
  color: #64748b;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.ticker-arrow {
  color: #38bdf8;
  font-weight: 700;
}

/* Category Pill Tabs */
.category-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  color: #94a3b8;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    color: #f8fafc;
    background: rgba(99, 102, 241, 0.15);
    border-color: rgba(99, 102, 241, 0.4);
  }

  &.active {
    color: #38bdf8;
    background: rgba(6, 182, 212, 0.15);
    border-color: rgba(56, 189, 248, 0.6);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.25);
  }
}

.pill-count {
  background: rgba(255, 255, 255, 0.1);
  padding: 1px 6px;
  border-radius: 9999px;
  font-size: 0.72rem;
}

/* Articles Grid */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}

.article-card {
  display: flex;
  flex-direction: column;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 14px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(56, 189, 248, 0.45);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(6, 182, 212, 0.15);
  }
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 0.75rem;
}

.meta-badge {
  font-weight: 700;
  font-size: 0.72rem;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  color: #38bdf8;

  &.badge-ai { color: #a855f7; background: rgba(168, 85, 247, 0.12); }
  &.badge-tech { color: #38bdf8; background: rgba(56, 189, 248, 0.12); }
  &.badge-space { color: #f59e0b; background: rgba(245, 158, 11, 0.12); }
  &.badge-archaeology { color: #10b981; background: rgba(16, 185, 129, 0.12); }
}

.meta-source {
  color: #94a3b8;
  font-weight: 500;
}

.meta-time {
  color: #64748b;
  margin-left: auto;
}

.card-media {
  width: 100%;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
  background: rgba(0, 0, 0, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.04);
  }
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.article-title {
  color: #f1f5f9;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.4;
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &:hover {
    color: #38bdf8;
  }
}

.article-snippet {
  color: #94a3b8;
  font-size: 0.8rem;
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
}

.read-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #38bdf8;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    color: #7dd3fc;
  }
}

.ext-icon {
  font-size: 0.85rem;
  font-weight: 700;
}

/* Skeleton Loading State */
.news-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}

.skeleton-card {
  height: 180px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.03);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: pulse-skeleton 1.5s infinite ease-in-out;
}

.skeleton-thumb {
  height: 90px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);

  &.full { width: 90%; }
  &.half { width: 50%; }
}

@keyframes pulse-skeleton {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 0.3; }
}

/* Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
