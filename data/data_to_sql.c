#include <stdio.h>
#include <string.h>

int main()
{

	FILE * fnfp = fopen("food_nutrient.csv", "r");
	FILE * foodfp = fopen("food.csv", "r");
	FILE * nfp = fopen("nutrient.csv", "r");

	FILE * wfnfp = fopen("food_nutrient_sqls.txt", "w");
	FILE * wfoodfp = fopen("food_sqls.txt", "w");
	FILE * wnfp = fopen("nutrient_sqls.txt", "w");

	char buf[2048];
	char * ptr;
	while (fgets(buf, 2048, fnfp)) {
		char tmp1[100];
		char tmp2[100];
		char tmp3[100];
		ptr = strtok(buf, ",");
		sscanf(ptr, "%s", tmp1);
		ptr = strtok(NULL, ",");
		sscanf(ptr, "%s", tmp2);
		ptr = strtok(NULL, ",");
		sscanf(ptr, "%s", tmp3);
		printf("%s %s %s\n", tmp1, tmp2, tmp3);
		fprintf(wfnfp, "INSERT INTO food_nutrient(food_nutrient_details, food_name_fn , amount) VALUES (\"%s\",\"%s\",%s);\n", tmp1, tmp2, tmp3);
	}

	while (fgets(buf, 2048, foodfp)) {
		char tmp1[100];
		char tmp2[100];
		ptr = strtok(buf, ",");
		sscanf(ptr, "%s", tmp1);
		ptr = strtok(NULL, ",");
		sscanf(ptr, "%s", tmp2);
		//printf("%s %s\n", tmp1, tmp2);
		fprintf(wfoodfp, "INSERT INTO food(name, amount) VALUES (\"%s\",%s);\n", tmp1, tmp2);
	}

	while (fgets(buf, 2048, nfp)) {
		char tmp1[100];
		char tmp2[100];
		ptr = strtok(buf, ",");
		sscanf(ptr, "%s", tmp1);
		ptr = strtok(NULL, ",");
		sscanf(ptr, "%s", tmp2);
		//printf("%s %s\n", tmp1, tmp2);
		fprintf(wnfp, "INSERT INTO nutrient(category, details) VALUES (\"%s\",\"%s\");\n", tmp1, tmp2);
	}

	fclose(fnfp);
	fclose(foodfp);
	fclose(wfoodfp);
	fclose(wfnfp);
	return 0;
}

