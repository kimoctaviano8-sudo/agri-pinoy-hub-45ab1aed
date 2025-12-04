import { supabase } from "@/integrations/supabase/client";

interface ScrapedNews {
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  image_url?: string;
  source_url: string;
  fullContent?: string;
}

export class NewsScraperService {
  private static readonly GEMINI_AGRI_URL = 'https://geminiagri.com/blog-standard/';
  
  static async scrapeGeminiAgriNews(): Promise<ScrapedNews[]> {
    try {
      // Fetch the news page
      const response = await fetch('/api/scrape-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: this.GEMINI_AGRI_URL }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      
      const data = await response.text();
      const articles = this.parseGeminiAgriContent(data);
      
      // Fetch full content for each article
      const articlesWithFullContent = await Promise.all(
        articles.map(async (article) => {
          try {
            const fullContent = await this.fetchFullArticleContent(article.source_url);
            return {
              ...article,
              excerpt: fullContent.excerpt || article.excerpt,
              fullContent: fullContent.content
            };
          } catch (error) {
            console.error(`Failed to fetch full content for ${article.title}:`, error);
            return article; // Return original if fetching fails
          }
        })
      );
      
      return articlesWithFullContent;
    } catch (error) {
      console.error('Error scraping Gemini Agri news:', error);
      return [];
    }
  }
  
  private static async fetchFullArticleContent(articleUrl: string): Promise<{ content: string; excerpt: string }> {
    try {
      const response = await fetch('/api/scrape-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: articleUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch article content');
      }
      
      const data = await response.text();
      return this.parseFullArticleContent(data);
    } catch (error) {
      console.error('Error fetching full article content:', error);
      return { content: '', excerpt: '' };
    }
  }
  
  private static parseFullArticleContent(content: string): { content: string; excerpt: string } {
    const lines = content.split('\n');
    let articleContent = '';
    let excerpt = '';
    let isContent = false;
    let contentLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip navigation and header content
      if (line.startsWith('#') && !isContent) {
        continue;
      }
      
      // Look for the main article content (usually starts after metadata)
      if (line.length > 50 && !line.startsWith('Author:') && !line.startsWith('Categories:') && 
          !line.includes('Menu') && !line.includes('navigation') && 
          !line.startsWith('http') && !line.startsWith('[')) {
        isContent = true;
        contentLines.push(line);
      } else if (isContent && line.length > 20) {
        contentLines.push(line);
      }
      
      // Stop if we hit footer content
      if (line.includes('All content is in the public domain') || 
          line.includes('Categories:') || 
          line.includes('Tags:')) {
        break;
      }
    }
    
    articleContent = contentLines.join('\n\n').trim();
    
    // Create excerpt from first 200 characters
    if (articleContent.length > 200) {
      excerpt = articleContent.substring(0, 200) + '...';
    } else {
      excerpt = articleContent;
    }
    
    return {
      content: articleContent || 'Content not available. Please visit the original article.',
      excerpt: excerpt || 'Excerpt not available.'
    };
  }
  
  private static parseGeminiAgriContent(content: string): ScrapedNews[] {
    const articles: ScrapedNews[] = [];
    
    console.log('parseGeminiAgriContent called with content length:', content.length);
    
    // Extract news articles from the content
    const lines = content.split('\n');
    console.log('Total lines:', lines.length);
    
    let currentArticle: Partial<ScrapedNews> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check for article title (### [title](url))
      const titleMatch = line.match(/^### \[(.*?)\]\((.*?)\)$/);
      if (titleMatch) {
        console.log('Found title:', titleMatch[1]);
        
        // Save previous article if exists
        if (currentArticle.title) {
          console.log('Saving article:', currentArticle.title);
          articles.push(currentArticle as ScrapedNews);
        }
        
        // Start new article
        currentArticle = {
          title: titleMatch[1],
          source_url: titleMatch[2],
          category: 'Gemini',
          author: 'Gemini Agri',
        };
      }
      
      // Check for date (next line after title)
      else if (currentArticle.title && !currentArticle.publishedAt) {
        const dateMatch = line.match(/^\[(.*?)\]/);
        if (dateMatch) {
          currentArticle.publishedAt = this.parseDate(dateMatch[1]);
          console.log('Found date:', dateMatch[1]);
        }
      }
      
      // Check for content/excerpt (line after date that's not empty and not a link)
      else if (currentArticle.publishedAt && !currentArticle.excerpt && line.length > 20 && 
               !line.startsWith('[') && !line.startsWith('!') && !line.includes('Read More')) {
        currentArticle.excerpt = this.createExcerpt(line);
        console.log('Found excerpt:', line.substring(0, 50) + '...');
      }
      
      // Extract image URLs from markdown format ![](url)
      else if (line.startsWith('![') && !currentArticle.image_url) {
        const imageMatch = line.match(/^\!\[\]\(([^)]+)\)$/);
        if (imageMatch) {
          currentArticle.image_url = imageMatch[1];
          console.log('Found image URL:', imageMatch[1]);
        }
      }
    }
    
    // Add the last article
    if (currentArticle.title && currentArticle.excerpt) {
      console.log('Saving last article:', currentArticle.title);
      articles.push(currentArticle as ScrapedNews);
    }
    
    console.log('Total articles before filtering:', articles.length);
    
    const filteredArticles = articles.filter(article => {
      const hasRequired = article.title && article.excerpt && article.author && article.publishedAt;
      if (!hasRequired) {
        console.log('Filtering out article due to missing fields:', {
          title: !!article.title,
          excerpt: !!article.excerpt,
          author: !!article.author,
          publishedAt: !!article.publishedAt,
          articleTitle: article.title
        });
      }
      return hasRequired;
    });
    
    console.log('Articles after filtering:', filteredArticles.length);
    return filteredArticles;
  }
  
  private static createExcerpt(content: string): string {
    if (!content) return '';
    
    // Create excerpt from first 150-200 characters, ending at a complete sentence
    let excerpt = content.substring(0, 200);
    
    // Find the last complete sentence within the limit
    const lastPeriod = excerpt.lastIndexOf('.');
    const lastExclamation = excerpt.lastIndexOf('!');
    const lastQuestion = excerpt.lastIndexOf('?');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastSentenceEnd > 100) {
      excerpt = excerpt.substring(0, lastSentenceEnd + 1);
    } else {
      // If no good sentence break, add ellipsis
      excerpt = excerpt.substring(0, 150) + '...';
    }
    
    return excerpt.trim();
  }
  
  private static parseDate(dateStr: string): string {
    try {
      // Convert "15 July 2025" to ISO format
      const date = new Date(dateStr);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  
  static async saveNewsToDatabase(articles: ScrapedNews[]): Promise<void> {
    try {
      // Check for existing articles to avoid duplicates
      const { data: existingNews } = await supabase
        .from('news')
        .select('title')
        .in('title', articles.map(a => a.title));
      
      const existingTitles = new Set(existingNews?.map(n => n.title) || []);
      const newArticles = articles.filter(article => !existingTitles.has(article.title));
      
      if (newArticles.length === 0) {
        console.log('No new articles to save');
        return;
      }
      
      // Transform articles for database
      const dbArticles = newArticles.map(article => {
        // Clean content by removing markdown image syntax
        let cleanContent = article.fullContent || article.excerpt + '\n\n[Read full article](' + article.source_url + ')';
        
        // Remove markdown image syntax like [![](url)]
        cleanContent = cleanContent.replace(/^\[\!\[\]\([^\)]+\)\]\s*\n*/gm, '');
        
        // Remove any leading whitespace/newlines
        cleanContent = cleanContent.replace(/^[\n\s]+/, '').trim();
        
        return {
          title: article.title,
          content: cleanContent,
          category: article.category,
          image_url: article.image_url || null,
          published: true,
          views: 0,
          created_at: article.publishedAt,
          updated_at: article.publishedAt,
        };
      });
      
      // Insert articles
      const { error } = await supabase
        .from('news')
        .insert(dbArticles);
      
      if (error) {
        throw error;
      }
      
      console.log(`Successfully saved ${newArticles.length} new articles`);
    } catch (error) {
      console.error('Error saving news to database:', error);
      throw error;
    }
  }
  
  static async importGeminiAgriNews(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const articles = await this.scrapeGeminiAgriNews();
      
      if (articles.length === 0) {
        return { success: false, count: 0, error: 'No articles found' };
      }
      
      await this.saveNewsToDatabase(articles);
      
      return { success: true, count: articles.length };
    } catch (error) {
      console.error('Error importing Gemini Agri news:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Fallback method using Gemini Agri content
  static async importFromScrapedContent(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Use the actual Gemini Agri content
      const geminiAgriContent = `
### [Brgy. Bulilan Norte, Pila, Laguna : Hybrid Rice and Fertilizer Derby 2025](https://geminiagri.com/laguna-hybrid-rice-and-fertilizer-derby-2025/)

[April 2, 2025]

Experience the future of rice farming at the Hybrid Rice & Fertilizer Derby 2025 in Laguna! 🌱✨ This event brings together farmers, agricultural experts, and industry leaders to showcase the latest innovations in hybrid rice varieties and advanced fertilizer technologies. Witness firsthand how these cutting-edge solutions can revolutionize crop yields and sustainable farming practices.

![](https://geminiagri.com/wp-content/uploads/2025/03/IMG_5476-840x473.jpeg)

### [Gemini secures 2nd place in highest yield category with Totem Biofertilizer.](https://geminiagri.com/gemini-corn-derby/)

[March 20, 2025]

Congratulations to the Gemini team for securing 2nd place in the Highest Yield category at the Hybrid Yellow Corn Derby held in Occidental Mindoro! With an impressive yield of 6.20 tons per hectare using our innovative Totem Biofertilizer, this achievement demonstrates the effectiveness of our sustainable agricultural solutions. The competition showcased various fertilizer technologies, and our biofertilizer stood out for its environmental benefits and remarkable crop enhancement capabilities.

![](https://geminiagri.com/wp-content/uploads/2022/07/462538787_1585945678713618_464155255689424664_n-840x473.jpg)

### [Help and Hope for Barangay Bugaan West, Laurel, Batangas](https://geminiagri.com/the-key-to-improving-agricultural-productivity/)

[November 4, 2024]

Due to the severe damage caused by Typhoon Kristine, we have provided relief goods to our fellow citizens in Barangay Bugaan West, Laurel, Batangas. Through this small effort, we hope to help ease their burden during these challenging times. Our company believes in supporting local communities, especially farmers who are the backbone of our agricultural sector. This initiative reflects our commitment to corporate social responsibility and community resilience.

![](https://geminiagri.com/wp-content/uploads/2022/07/483851764_1712346979440152_7237334932851761825_n-840x473.jpg)

### [Founder's Week Outreach Program – Bahay Ampunan in Altura](https://geminiagri.com/efficient-farm-production-through-knowledge-sharing/)

[September 18, 2024]

Gemini Agri Farm Solutions Corp. also held a special program for the orphanage in Altura, where we shared gifts and food. This was not just an event but a joyful celebration of giving back to the community. Our founder's week celebration emphasized the importance of nurturing not only crops but also the human spirit through acts of kindness and generosity.

![](https://geminiagri.com/wp-content/uploads/2022/07/471593503_1658395078176009_5055844651701006949_n-840x473.jpg)

### [Farmer's Week Celebration](https://geminiagri.com/organic-farming-what-is-it-and-why-its-important/)

[May 7, 2024]

Photos were taken during the opening of the Farmer's Week Celebration and the ongoing Agri-Fair at Orgulyo Grounds in Barangay Salvacion Poblacion. The event showcases and sells products produced by local farmers, highlighting the importance of supporting homegrown agricultural products and celebrating the hard work of our farming communities.

![](https://geminiagri.com/wp-content/uploads/2022/07/488529636_1755953131745103_8318020885097354700_n-840x473.jpg)

### [Together, We Thrive in a Prosperous New Philippines](https://geminiagri.com/polyculture-farming-and-digital-agriculture-systems/)

[March 20, 2024]

Featured are the latest rice farming technologies based on the projects and programs implemented by DA-PhilRice. This showcase demonstrates how innovative agricultural technologies can transform traditional farming methods, leading to increased productivity and sustainable farming practices that benefit both farmers and consumers.

![](https://geminiagri.com/wp-content/uploads/2022/07/478896725_1708001253213978_2516756655327925639_n-840x473.jpg)

### [MOST ADVANCE FOLIAR FERTILIZER](https://geminiagri.com/sprinkler-irrigation-why-successful-farmers-use-it/)

[March 13, 2024]

We are excited to introduce to you the latest Foliar Fertilizer, which can be used in our farms to achieve better and more abundant harvests. Foliar fertilizer plays a crucial role in modern agriculture by providing essential nutrients directly to plant leaves, ensuring faster absorption and improved crop health. This advanced formula represents the cutting edge of agricultural technology.

![](https://geminiagri.com/wp-content/uploads/2022/07/485166871_1738669136780523_9184607950066994142_n-840x473.jpg)
`;
      
      console.log('Using Gemini Agri content for import');
      const articles = this.parseGeminiAgriContent(geminiAgriContent);
      
      if (articles.length === 0) {
        return { success: false, count: 0, error: 'No articles found in Gemini Agri content' };
      }
      
      await this.saveNewsToDatabase(articles);
      
      return { success: true, count: articles.length };
    } catch (error) {
      console.error('Error importing from Gemini Agri content:', error);
      return { 
        success: false, 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}