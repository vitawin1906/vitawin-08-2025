
interface SeoArticleProps {
  title: string;
}

const SeoArticle = ({ title }: SeoArticleProps) => {
  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="prose prose-emerald mx-auto">
        <p>
          Omega-3 fatty acids are essential nutrients that play a crucial role in maintaining optimal health. 
          These polyunsaturated fats are not produced naturally by the body, making dietary sources or supplements necessary for meeting daily requirements.
        </p>
        <h3>Cardiovascular Benefits</h3>
        <p>
          Research consistently shows that omega-3 fatty acids support heart health in multiple ways. They help reduce triglycerides, lower blood pressure, 
          decrease inflammation, and improve endothelial function. Regular consumption of omega-3s has been associated with a reduced risk of heart disease and stroke.
        </p>
        <h3>Brain and Cognitive Function</h3>
        <p>
          DHA, a type of omega-3 fatty acid, is a major structural component of the brain. Adequate intake of omega-3s supports cognitive function, memory, 
          and may help protect against age-related cognitive decline. Studies suggest that omega-3 supplementation may benefit certain aspects of brain health throughout life.
        </p>
        <h3>Anti-inflammatory Properties</h3>
        <p>
          Omega-3 fatty acids possess potent anti-inflammatory properties that can help reduce chronic inflammation, a common factor in many diseases. 
          This makes them beneficial for conditions like rheumatoid arthritis, inflammatory bowel disease, and other inflammatory conditions.
        </p>
        <h3>Conclusion</h3>
        <p>
          Incorporating omega-3 fatty acids into your daily routine through high-quality supplements like our Omega-3 Fish Oil can provide numerous health benefits. 
          As always, consult with your healthcare provider before starting any new supplement regimen.
        </p>
      </div>
    </div>
  );
};

export default SeoArticle;
