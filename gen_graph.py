#run with: python gen_graph.py src dest

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import sys, os


src = sys.argv[1]#'C:/Users/gaber/Documents/499RawData'
dest = sys.argv[2]#'C:/Users/gaber/Documents/499DataCharts'
#os.chdir(src)
#print(os.listdir())
bounds = {
    'avgFitness': [0, 0],
    'totalPreyHuntedCount': [0, 0],
    'totalTicksOutOfBounds': [0, 0],
    'avgEnergySpent': [0, 0],
    'avgPercDead': [0, 0],
    'totalFoodConsumptionCount': [0, 0],
    'avgPredWinnerBonus': [0, 0]
}

def determineMax(curr):
    folders = os.listdir(src + curr)
    #print(folders)
    for f in folders:
        if '.' in f:
            df = pd.read_csv(src + curr + '/' + f)
            labels = updateBounds(f, df)
        else:
            determineMax(curr + '/' + f)

def updateBounds(file, df):
    fparts = file.split('_')
    fMax = df.max().max()
    fMin = df.min().min()
    currMax = bounds[fparts[0]][1]
    currMin = bounds[fparts[0]][0]
    bounds[fparts[0]][1] = max(fMax, currMax)
    bounds[fparts[0]][0] = min(fMin, currMin)

def getBounds(file):
    fparts = file.split('_')
    return bounds[fparts[0]]

def recurseFolders(curr):
    folders = os.listdir(src + curr)
    #print(folders)
    for f in folders:
        if not '.' in f:
            os.mkdir(dest + curr + '/' + f)
            recurseFolders(curr + '/' + f)
        else:
            labels = getPlotLabels(f)
            print(labels)
            createPlot(src + curr + '/' + f, dest + curr, labels[0], labels[1], labels[2], getBounds(f))

def getPlotLabels(file):
    fparts = file.split('_')
    labels = []
    labels.append(getTitle(fparts))
    labels.append('Generation')
    labels.append(getYLabel(fparts))
    return labels

def getTitle(fparts):
    titleId = fparts[0]
    titleId2 = fparts[1]
    if titleId == 'avgFitness':
        return 'Average Agent Fitness Per Generation'
    elif titleId == 'totalPreyHuntedCount':
        return 'Total Prey Hunted Per Generation'
    elif titleId == 'totalTicksOutOfBounds' and titleId2 == 'Predator':
        return 'Total Predator Ticks Out of Bounds Per Generation'
    elif titleId == 'totalTicksOutOfBounds' and titleId2 == 'Prey':
        return 'Total Prey Ticks Out of Bounds Per Generation'
    elif titleId == 'totalTicksOutOfBounds':
        return 'Total Ticks Out of Bounds Per Generation'
    elif titleId == 'avgEnergySpent':
        return 'Average Energy Spent Per Generation'
    elif titleId == 'avgPercDead':
        return 'Average Percentage of Time Spent Dead Per Generation'
    elif titleId == 'totalFoodConsumptionCount':
        return 'Total Food Consumed by Prey Per Generation'
    elif titleId == 'avgPredWinnerBonus':
        return 'Average Predator Winner Bonus Per Generation'
    else:
        print('A title ID does not exist yet! Add ' + titleId + ' to the getTitle(titleId) method.', file=sys.stderr)
    return 'error :('

def getYLabel(fparts):
    titleId = fparts[0]
    if titleId == 'avgFitness':
        return 'Average Agent Fitness'
    elif titleId == 'totalPreyHuntedCount':
        return 'Total Prey Hunted'
    elif titleId == 'totalTicksOutOfBounds':
        return 'Total Ticks Out of Bounds'
    elif titleId == 'avgEnergySpent':
        return 'Average Energy Spent'
    elif titleId == 'avgPercDead':
        return 'Average Percentage of Time Spent Dead'
    elif titleId == 'totalFoodConsumptionCount':
        return 'Total Food Consumed by Prey'
    elif titleId == 'avgPredWinnerBonus':
        return 'Average Predator Winner Bonus'
    else:
        print('A title ID does not exist yet! Add ' + titleId + ' to the getTitle(titleId) method.', file=sys.stderr)
    return 'error :('

def createPlot(csv_path, plotDest, title, x_label, y_label, bounds):
    df = pd.read_csv(csv_path)

    c_len = len(df.columns)
    scatter = df.drop('Average', axis = 'columns') 

    for c in scatter.columns:
        plt.scatter(scatter.index.array, scatter[c],  4, label = c)
    if 'Average' in df.columns:
        plt.plot(df['Average'], linewidth = 2, label = 'Average', color = 'black')
    plt.xlabel(x_label)
    plt.ylabel(y_label)
    plt.title(title)
    plt.legend()
    plt.ylim(top = bounds[1], bottom = bounds[0])
    #plt.show()

    fileName = title.replace(' ', '_')
    plt.savefig(plotDest + '/' + fileName +'.png')
    plt.clf()

if len(os.listdir(dest)) != 0:
    print('Please clear your destination directory and try again...', file = sys.stderr)
    exit(1)
determineMax('')
recurseFolders('')