import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import sys

csv_path = sys.argv[1]
print(csv_path)
df = pd.read_csv(csv_path)

c_len = len(df.columns)
scatter = df.drop('Average', axis = 'columns') #df.iloc[:,0:c_len-1]
#plt.scatter(range(0, len(scatter)), scatter)
for c in scatter.columns:
    plt.scatter(scatter.index.array, scatter[c],  4, label = c)
if 'Average' in df.columns:
    plt.plot(df['Average'], linewidth = 3, label = 'Average', color = 'black')
plt.xlabel('Generation')
plt.ylabel('Average Fitness')
plt.title('Average Fitness Per Generation')
plt.legend()
plt.show()